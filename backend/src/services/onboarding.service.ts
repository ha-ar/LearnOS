import { query, pool } from '../db/index.js';

/**
 * Onboarding & Digital Twin bootstrap.
 *
 * Flow:
 *   1. Learner registers (auth) and takes a short placement diagnostic.
 *   2. submitPlacement() grades the answers, writes evidence-backed mastery
 *      into the Digital Twin (learner_competency_states), records learning
 *      preferences, and generates a personalised learning plan ordered by the
 *      competency prerequisite graph.
 *   3. getNextRecommendation() reads live twin state + the plan to decide the
 *      next competency/lesson the learner should work on. It advances
 *      automatically as the learner's mastery improves.
 */

const PILOT_CURRICULUM_ID = 'a0000000-0000-0000-0000-000000000001';
const DIAGNOSTIC_RESOURCE_ID = 'b1000000-0000-0000-0000-000000000010';
const DEFAULT_SUBJECT = 'Mathematics';

const MASTERED = new Set(['proficient', 'mastered']);

export interface PlacementAnswer {
  question_id: string;
  selected: string; // option key, e.g. "b"
}

export interface SubmitPlacementInput {
  learner_id: string;
  tenant_id?: string;
  grade?: string;
  subject?: string;
  answers: PlacementAnswer[];
  preferences?: {
    preferred_format?: string;
    preferred_session_length_min?: number;
  };
}

interface CompetencyRow {
  id: string;
  subject: string;
  topic: string;
  grade_level: string | null;
  prerequisite_ids: string[];
}

export class OnboardingService {
  /** Parse "Grade 6" -> 6; returns a large number when unknown so it sorts last. */
  private static gradeRank(grade: string | null | undefined): number {
    if (!grade) return 99;
    const m = String(grade).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 99;
  }

  /** Map a placement score (0..1) to a Digital Twin mastery level. */
  private static masteryFromScore(score: number, attempted: number): string {
    if (attempted === 0) return 'not_started';
    if (score >= 0.8) return 'proficient';
    if (score >= 0.5) return 'developing';
    return 'emerging';
  }

  /**
   * GET placement test questions for a subject (correct answers stripped).
   */
  static async getPlacementTest(subject: string = DEFAULT_SUBJECT) {
    const res = await query(
      `SELECT q.id, q.competency_id, q.question_text, q.question_type, q.options,
              q.difficulty, q.grade_level, q.display_order,
              c.topic, c.grade_level AS competency_grade
       FROM quiz_questions q
       JOIN competencies c ON c.id = q.competency_id
       WHERE q.resource_id = $1 AND c.subject = $2
       ORDER BY q.display_order ASC`,
      [DIAGNOSTIC_RESOURCE_ID, subject]
    );

    return {
      subject,
      total_questions: res.rows.length,
      questions: res.rows.map((r: any) => ({
        id: r.id,
        competency_id: r.competency_id,
        topic: r.topic,
        grade_level: r.grade_level,
        difficulty: r.difficulty,
        question_text: r.question_text,
        question_type: r.question_type,
        options: r.options,
      })),
    };
  }

  /**
   * Grade the placement test, initialise the Digital Twin, and generate a
   * personalised learning plan. Runs in a single transaction.
   */
  static async submitPlacement(input: SubmitPlacementInput) {
    const subject = input.subject || DEFAULT_SUBJECT;
    const answerMap = new Map<string, string>();
    for (const a of input.answers || []) {
      if (a && a.question_id) answerMap.set(a.question_id, a.selected);
    }

    // 1. Load the diagnostic questions with correct answers + competency tags.
    const qRes = await query(
      `SELECT q.id, q.competency_id, q.correct_answer, c.topic
       FROM quiz_questions q
       JOIN competencies c ON c.id = q.competency_id
       WHERE q.resource_id = $1 AND c.subject = $2`,
      [DIAGNOSTIC_RESOURCE_ID, subject]
    );
    if (qRes.rows.length === 0) {
      throw { status: 400, error: 'No placement test found for this subject', code: 'NO_PLACEMENT_TEST' };
    }

    // 2. Grade per competency.
    const perComp = new Map<string, { topic: string; total: number; correct: number }>();
    for (const q of qRes.rows) {
      const entry = perComp.get(q.competency_id) || { topic: q.topic, total: 0, correct: 0 };
      const given = answerMap.get(q.id);
      if (given !== undefined) {
        entry.total += 1;
        if (String(given).toLowerCase() === String(q.correct_answer).toLowerCase()) entry.correct += 1;
      }
      perComp.set(q.competency_id, entry);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Persist grade + curriculum on the learner profile.
      if (input.grade) {
        await client.query(
          `UPDATE learner_profiles
           SET grade = $2, curriculum_id = COALESCE(curriculum_id, $3)
           WHERE learner_id = $1`,
          [input.learner_id, input.grade, PILOT_CURRICULUM_ID]
        );
      }

      // 4. Record learning preferences on the twin profile.
      const prefs = input.preferences || {};
      if (prefs.preferred_format || prefs.preferred_session_length_min) {
        await client.query(
          `INSERT INTO learner_profiles_twin
             (learner_id, preferred_format, preferred_session_length_min, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (learner_id) DO UPDATE
             SET preferred_format = COALESCE(EXCLUDED.preferred_format, learner_profiles_twin.preferred_format),
                 preferred_session_length_min = COALESCE(EXCLUDED.preferred_session_length_min, learner_profiles_twin.preferred_session_length_min),
                 updated_at = NOW()`,
          [input.learner_id, prefs.preferred_format || null, prefs.preferred_session_length_min || null]
        );
      }

      // 5. Write evidence-backed mastery into the Digital Twin.
      const placementResult: Array<{ competency_id: string; topic: string; total: number; correct: number; mastery_level: string; mastery_score: number }> = [];
      for (const [compId, stats] of perComp.entries()) {
        const score = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) / 100 : 0;
        const level = this.masteryFromScore(score, stats.total);
        const summary = `Placement diagnostic: ${stats.correct} of ${stats.total} correct on ${stats.topic}.`;

        await client.query(
          `INSERT INTO learner_competency_states
             (learner_id, competency_id, mastery_level, mastery_score, attempts_total,
              attempts_correct, last_practiced_at, review_due_at, evidence_summary, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '7 days', $7, NOW())
           ON CONFLICT (learner_id, competency_id) DO UPDATE
             SET mastery_level = EXCLUDED.mastery_level,
                 mastery_score = EXCLUDED.mastery_score,
                 attempts_total = learner_competency_states.attempts_total + EXCLUDED.attempts_total,
                 attempts_correct = learner_competency_states.attempts_correct + EXCLUDED.attempts_correct,
                 last_practiced_at = NOW(),
                 review_due_at = NOW() + INTERVAL '7 days',
                 evidence_summary = EXCLUDED.evidence_summary,
                 updated_at = NOW()`,
          [input.learner_id, compId, level, score, stats.total, stats.correct, summary]
        );

        placementResult.push({ competency_id: compId, topic: stats.topic, total: stats.total, correct: stats.correct, mastery_level: level, mastery_score: score });
      }

      // 6. Generate the personalised learning plan.
      const plan = await this.generatePlan(client, {
        learner_id: input.learner_id,
        subject,
        grade: input.grade,
        masteryByComp: new Map(placementResult.map((p) => [p.competency_id, p.mastery_level])),
      });

      await client.query('COMMIT');

      const nextRecommendation = await this.getNextRecommendation(input.learner_id, subject);

      return {
        placement_result: placementResult,
        plan,
        next_recommendation: nextRecommendation,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Order the subject competencies via a prerequisite-aware topological sort,
   * then (re)create the active learning plan and its ordered items. Items whose
   * competency is already proficient/mastered from the diagnostic are marked
   * completed; the first unmet item is marked in_progress.
   */
  private static async generatePlan(
    client: any,
    params: { learner_id: string; subject: string; grade?: string; masteryByComp: Map<string, string> }
  ) {
    const compRes = await client.query(
      `SELECT id, subject, topic, grade_level, prerequisite_ids
       FROM competencies
       WHERE curriculum_id = $1 AND subject = $2 AND is_active = true`,
      [PILOT_CURRICULUM_ID, params.subject]
    );
    const competencies: CompetencyRow[] = compRes.rows;
    const ordered = this.topoSort(competencies);

    // Archive any previous active plan for this subject.
    await client.query(
      `UPDATE learning_plans SET status = 'archived'
       WHERE learner_id = $1 AND subject = $2 AND status = 'active'`,
      [params.learner_id, params.subject]
    );

    const termLabel = `Placement ${new Date().toISOString().slice(0, 10)}`;
    const planRes = await client.query(
      `INSERT INTO learning_plans (learner_id, curriculum_id, term_label, subject, status, created_by)
       VALUES ($1, $2, $3, $4, 'active', $1)
       RETURNING id, learner_id, curriculum_id, term_label, subject, status, created_at`,
      [params.learner_id, PILOT_CURRICULUM_ID, termLabel, params.subject]
    );
    const plan = planRes.rows[0];

    let firstPendingAssigned = false;
    const items: any[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const comp = ordered[i];
      const mastery = params.masteryByComp.get(comp.id);
      let status = 'not_started';
      if (mastery && MASTERED.has(mastery)) {
        status = 'completed';
      } else if (!firstPendingAssigned) {
        status = 'in_progress';
        firstPendingAssigned = true;
      }

      const itemRes = await client.query(
        `INSERT INTO learning_plan_items (plan_id, competency_id, sequence_order, target_mastery_level, status)
         VALUES ($1, $2, $3, 'proficient', $4)
         RETURNING id, competency_id, sequence_order, target_mastery_level, status`,
        [plan.id, comp.id, i + 1, status]
      );
      items.push({ ...itemRes.rows[0], topic: comp.topic, grade_level: comp.grade_level });
    }

    return { ...plan, items };
  }

  /**
   * Kahn's algorithm over the subject competency set. Ties are broken by grade
   * then topic so the sequence reads sensibly. Prerequisites outside the set
   * are ignored.
   */
  private static topoSort(competencies: CompetencyRow[]): CompetencyRow[] {
    const byId = new Map(competencies.map((c) => [c.id, c]));
    const indeg = new Map<string, number>();
    const deps = new Map<string, string[]>(); // comp -> prereqs within set

    for (const c of competencies) {
      const prereqs = (c.prerequisite_ids || []).filter((p) => byId.has(p));
      deps.set(c.id, prereqs);
      indeg.set(c.id, prereqs.length);
    }

    const cmp = (a: CompetencyRow, b: CompetencyRow) => {
      const g = this.gradeRank(a.grade_level) - this.gradeRank(b.grade_level);
      if (g !== 0) return g;
      return a.topic.localeCompare(b.topic);
    };

    const ready = competencies.filter((c) => (indeg.get(c.id) || 0) === 0).sort(cmp);
    const result: CompetencyRow[] = [];
    const remaining = new Set(competencies.map((c) => c.id));

    while (ready.length > 0) {
      const node = ready.shift()!;
      if (!remaining.has(node.id)) continue;
      result.push(node);
      remaining.delete(node.id);

      for (const other of competencies) {
        if (!remaining.has(other.id)) continue;
        const prereqs = deps.get(other.id)!;
        if (prereqs.includes(node.id)) {
          indeg.set(other.id, (indeg.get(other.id) || 1) - 1);
          if ((indeg.get(other.id) || 0) === 0) {
            ready.push(other);
            ready.sort(cmp);
          }
        }
      }
    }

    // Any leftover (cycle / unresolved) appended in a stable order.
    if (remaining.size > 0) {
      const leftovers = competencies.filter((c) => remaining.has(c.id)).sort(cmp);
      result.push(...leftovers);
    }
    return result;
  }

  /**
   * Decide the learner's next competency + lesson based on live twin state and
   * the active plan. Returns the first not-yet-mastered competency (in plan
   * order) whose prerequisites are all met, plus a recommended primary resource.
   */
  static async getNextRecommendation(learnerId: string, subject: string = DEFAULT_SUBJECT) {
    const planRes = await query(
      `SELECT id FROM learning_plans
       WHERE learner_id = $1 AND subject = $2 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [learnerId, subject]
    );
    if (planRes.rows.length === 0) {
      return { has_plan: false, message: 'No active learning plan. Complete the placement test to get started.' };
    }
    const planId = planRes.rows[0].id;

    // Plan items in order, joined with competency + this learner's mastery.
    const itemsRes = await query(
      `SELECT i.competency_id, i.sequence_order, i.status AS item_status,
              c.topic, c.grade_level, c.prerequisite_ids,
              lcs.mastery_level, lcs.mastery_score
       FROM learning_plan_items i
       JOIN competencies c ON c.id = i.competency_id
       LEFT JOIN learner_competency_states lcs
         ON lcs.competency_id = i.competency_id AND lcs.learner_id = $2
       WHERE i.plan_id = $1
       ORDER BY i.sequence_order ASC`,
      [planId, learnerId]
    );
    const items = itemsRes.rows;

    const masteryOf = new Map<string, string>(
      items.map((r: any) => [r.competency_id, r.mastery_level || 'not_started'])
    );
    const isMastered = (compId: string) => MASTERED.has(masteryOf.get(compId) || 'not_started');

    const total = items.length;
    const completed = items.filter((r: any) => isMastered(r.competency_id)).length;

    // First not-mastered item whose in-plan prerequisites are all mastered.
    let next: any = null;
    for (const r of items) {
      if (isMastered(r.competency_id)) continue;
      const prereqs: string[] = (r.prerequisite_ids || []).filter((p: string) => masteryOf.has(p));
      const prereqsMet = prereqs.every((p) => isMastered(p));
      if (prereqsMet) {
        next = r;
        break;
      }
    }
    // Fallback: prerequisites not yet met anywhere -> take the first not-mastered.
    if (!next) next = items.find((r: any) => !isMastered(r.competency_id)) || null;

    if (!next) {
      return {
        has_plan: true,
        complete: true,
        plan_progress: { completed, total },
        message: 'You have mastered every competency in your current plan. Great work!',
      };
    }

    // Recommend a primary resource for the next competency (skip diagnostics).
    const resRes = await query(
      `SELECT r.id, r.title, r.format, r.url, r.duration_min, rcm.fit_type
       FROM resource_competency_map rcm
       JOIN resources r ON r.id = rcm.resource_id
       WHERE rcm.competency_id = $1 AND r.is_active = true AND r.format <> 'internal_quiz'
       ORDER BY CASE rcm.fit_type WHEN 'primary' THEN 0 WHEN 'supplementary' THEN 1 ELSE 2 END,
                r.duration_min ASC NULLS LAST
       LIMIT 1`,
      [next.competency_id]
    );
    const resource = resRes.rows[0] || null;

    const level = masteryOf.get(next.competency_id) || 'not_started';
    const reason =
      level === 'not_started'
        ? `Start "${next.topic}" — it's the next topic in your plan.`
        : `Keep building "${next.topic}" — you're at "${level}" and prerequisites are in place.`;

    return {
      has_plan: true,
      complete: false,
      plan_progress: { completed, total },
      next_competency: {
        competency_id: next.competency_id,
        topic: next.topic,
        grade_level: next.grade_level,
        current_mastery: level,
        sequence_order: next.sequence_order,
      },
      recommended_resource: resource,
      reason,
    };
  }

  /**
   * Read the active learning plan with per-item mastery for display.
   */
  static async getLearningPlan(learnerId: string, subject: string = DEFAULT_SUBJECT) {
    const planRes = await query(
      `SELECT id, term_label, subject, status, created_at
       FROM learning_plans
       WHERE learner_id = $1 AND subject = $2 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [learnerId, subject]
    );
    if (planRes.rows.length === 0) return { has_plan: false, plan: null, items: [] };
    const plan = planRes.rows[0];

    const itemsRes = await query(
      `SELECT i.competency_id, i.sequence_order, i.target_mastery_level, i.status AS item_status,
              c.topic, c.grade_level,
              COALESCE(lcs.mastery_level, 'not_started') AS mastery_level,
              lcs.mastery_score
       FROM learning_plan_items i
       JOIN competencies c ON c.id = i.competency_id
       LEFT JOIN learner_competency_states lcs
         ON lcs.competency_id = i.competency_id AND lcs.learner_id = $2
       WHERE i.plan_id = $1
       ORDER BY i.sequence_order ASC`,
      [plan.id, learnerId]
    );

    return { has_plan: true, plan, items: itemsRes.rows };
  }
}

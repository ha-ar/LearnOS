import { query } from '../db/index.js';
import { EventService } from './event.service.js';

export class TwinService {
  /**
   * Get full Digital Twin summary for a learner
   */
  static async getTwinSummary(learnerId: string) {
    // 1. Fetch competencies states
    const compRes = await query(
      `SELECT lcs.id, lcs.competency_id, c.subject, c.topic, c.subtopic, c.grade_level,
              lcs.mastery_level, lcs.mastery_score, lcs.attempts_total, lcs.attempts_correct,
              lcs.learner_confidence, lcs.last_practiced_at, lcs.review_due_at, lcs.evidence_summary
       FROM learner_competency_states lcs
       JOIN competencies c ON c.id = lcs.competency_id
       WHERE lcs.learner_id = $1
       ORDER BY lcs.updated_at DESC`,
      [learnerId]
    );

    // 2. Fetch learning twin profile
    const profileRes = await query(
      `SELECT preferred_format, preferred_session_length_min, hint_response, pace_signal, notes
       FROM learner_profiles_twin WHERE learner_id = $1`,
      [learnerId]
    );

    // 3. Fetch active goals
    const goalsRes = await query(
      `SELECT id, goal_type, description, target_date, status, created_at
       FROM learner_goals WHERE learner_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [learnerId]
    );

    // 4. Fetch recent portfolio items
    const portfolioRes = await query(
      `SELECT id, item_type, title, description, file_url, competency_ids, created_at
       FROM portfolio_items WHERE learner_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [learnerId]
    );

    // 5. Fetch recent mentor notes
    const notesRes = await query(
      `SELECT id, mentor_id, note_type, note_text, is_parent_visible, created_at
       FROM mentor_notes WHERE learner_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [learnerId]
    );

    // 6. Fetch recent session events
    const eventsRes = await query(
      `SELECT id, session_id, event_type, competency_id, resource_id, payload, timestamp
       FROM session_events WHERE learner_id = $1
       ORDER BY timestamp DESC LIMIT 10`,
      [learnerId]
    );

    return {
      learner_id: learnerId,
      competencies: compRes.rows,
      learning_profile: profileRes.rows[0] || null,
      active_goals: goalsRes.rows,
      recent_portfolio: portfolioRes.rows,
      recent_mentor_notes: notesRes.rows,
      recent_events: eventsRes.rows,
    };
  }

  /**
   * Get all competency states for a learner
   */
  static async getCompetencies(learnerId: string) {
    const res = await query(
      `SELECT lcs.id, lcs.competency_id, c.subject, c.topic, c.subtopic, c.grade_level,
              c.prerequisite_ids, lcs.mastery_level, lcs.mastery_score, lcs.attempts_total,
              lcs.attempts_correct, lcs.learner_confidence, lcs.last_practiced_at,
              lcs.review_due_at, lcs.evidence_summary, lcs.updated_at
       FROM learner_competency_states lcs
       JOIN competencies c ON c.id = lcs.competency_id
       WHERE lcs.learner_id = $1
       ORDER BY c.subject, c.topic`,
      [learnerId]
    );
    return res.rows;
  }

  /**
   * Get specific competency state for a learner
   */
  static async getCompetencyById(learnerId: string, competencyId: string) {
    const res = await query(
      `SELECT lcs.id, lcs.competency_id, c.subject, c.topic, c.subtopic, c.grade_level,
              c.prerequisite_ids, c.description as competency_description,
              lcs.mastery_level, lcs.mastery_score, lcs.attempts_total, lcs.attempts_correct,
              lcs.learner_confidence, lcs.last_practiced_at, lcs.review_due_at,
              lcs.evidence_summary, lcs.updated_at
       FROM learner_competency_states lcs
       JOIN competencies c ON c.id = lcs.competency_id
       WHERE lcs.learner_id = $1 AND lcs.competency_id = $2`,
      [learnerId, competencyId]
    );

    if (res.rows.length === 0) {
      // Check if competency exists in global catalogue
      const catRes = await query(`SELECT * FROM competencies WHERE id = $1`, [competencyId]);
      if (catRes.rows.length === 0) {
        throw { status: 404, error: 'Competency not found', code: 'NOT_FOUND' };
      }

      // Return default unstarted state
      const comp = catRes.rows[0];
      return {
        competency_id: comp.id,
        subject: comp.subject,
        topic: comp.topic,
        subtopic: comp.subtopic,
        grade_level: comp.grade_level,
        prerequisite_ids: comp.prerequisite_ids,
        mastery_level: 'not_started',
        mastery_score: 0.0,
        attempts_total: 0,
        attempts_correct: 0,
        learner_confidence: null,
        last_practiced_at: null,
        review_due_at: null,
        evidence_summary: 'No learning activity recorded yet for this competency.',
        updated_at: null,
      };
    }

    return res.rows[0];
  }

  /**
   * Get real Course & Subject Progress breakdown for a learner
   */
  static async getLearnerCourseProgress(learnerId: string) {
    // 1. Resolve learner profile
    const profileRes = await query(
      `SELECT lp.grade, lp.curriculum_id, c.name as curriculum_name
       FROM learner_profiles lp
       LEFT JOIN curricula c ON c.id = lp.curriculum_id
       WHERE lp.learner_id = $1`,
      [learnerId]
    );

    const grade = profileRes.rows[0]?.grade || 'Grade 7';
    const curriculumId = profileRes.rows[0]?.curriculum_id;
    const curriculumName = profileRes.rows[0]?.curriculum_name || 'International Baccalaureate';

    // 2. Fetch all competencies for this curriculum and grade
    const allCompRes = await query(
      `SELECT id, subject, topic, sequence_order, programme, description
       FROM competencies
       WHERE is_active = true
         AND ($1::uuid IS NULL OR curriculum_id = $1)
         AND ($2::text IS NULL OR grade_level = $2)
       ORDER BY subject, sequence_order ASC NULLS LAST, created_at ASC`,
      [curriculumId || null, grade]
    );

    // 3. Fetch learner states
    const statesRes = await query(
      `SELECT competency_id, mastery_level, mastery_score, attempts_total, attempts_correct
       FROM learner_competency_states
       WHERE learner_id = $1`,
      [learnerId]
    );

    const statesMap = new Map<string, any>();
    for (const s of statesRes.rows) {
      statesMap.set(s.competency_id, s);
    }

    // Group competencies by subject
    const subjectMap = new Map<string, any[]>();
    for (const comp of allCompRes.rows) {
      const subject = comp.subject || 'General';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, []);
      }
      subjectMap.get(subject)!.push(comp);
    }

    const courses: Array<{
      subject: string;
      curriculum_name: string;
      grade: string;
      total_topics: number;
      completed_topics: number;
      in_progress_topics: number;
      progress_percent: number;
      next_topic: string;
      next_competency_id: string | null;
      all_topics: Array<{
        id: string;
        topic: string;
        order: number;
        status: 'completed' | 'in_progress' | 'upcoming';
        mastery_level: string;
        mastery_score: number;
      }>;
    }> = [];

    let totalCurriculumTopics = 0;
    let totalCompletedTopics = 0;

    for (const [subject, comps] of subjectMap.entries()) {
      let completedCount = 0;
      let inProgressCount = 0;
      let nextTopic: string = comps[0]?.topic || 'Introductory Unit';
      let nextCompId: string | null = comps[0]?.id || null;
      let foundNext = false;

      const topics = comps.map((c, idx) => {
        const state = statesMap.get(c.id);
        const masteryScore = state ? parseFloat(state.mastery_score) : 0;
        const attempts = state ? parseInt(state.attempts_total, 10) : 0;

        let status: 'completed' | 'in_progress' | 'upcoming' = 'upcoming';
        if (state && (state.mastery_level === 'proficient' || masteryScore >= 0.8)) {
          status = 'completed';
          completedCount++;
        } else if (state && (attempts > 0 || masteryScore > 0)) {
          status = 'in_progress';
          inProgressCount++;
          if (!foundNext) {
            nextTopic = c.topic;
            nextCompId = c.id;
            foundNext = true;
          }
        } else if (!foundNext) {
          nextTopic = c.topic;
          nextCompId = c.id;
          foundNext = true;
        }

        return {
          id: c.id,
          topic: c.topic,
          order: c.sequence_order || (idx + 1),
          status,
          mastery_level: state?.mastery_level || 'not_started',
          mastery_score: masteryScore,
        };
      });

      totalCurriculumTopics += comps.length;
      totalCompletedTopics += completedCount;

      const progressPercent = comps.length > 0 ? Math.round((completedCount / comps.length) * 100) : 0;

      courses.push({
        subject,
        curriculum_name: curriculumName,
        grade,
        total_topics: comps.length,
        completed_topics: completedCount,
        in_progress_topics: inProgressCount,
        progress_percent: progressPercent,
        next_topic: nextTopic,
        next_competency_id: nextCompId,
        all_topics: topics,
      });
    }

    const overallProgressPercent = totalCurriculumTopics > 0 ? Math.round((totalCompletedTopics / totalCurriculumTopics) * 100) : 0;

    return {
      learner_id: learnerId,
      grade,
      curriculum_name: curriculumName,
      overall_progress_percent: overallProgressPercent,
      total_courses: courses.length,
      total_curriculum_topics: totalCurriculumTopics,
      total_completed_topics: totalCompletedTopics,
      courses,
    };
  }

  /**
   * Auto-generate human-readable evidence summary from stats
   */
  static generateEvidenceSummary(
    topicName: string,
    attemptsTotal: number,
    attemptsCorrect: number,
    confidence?: number | null
  ): string {
    const pct = attemptsTotal > 0 ? Math.round((attemptsCorrect / attemptsTotal) * 100) : 0;
    let summary = `${attemptsCorrect} of ${attemptsTotal} check questions correct (${pct}%) on ${topicName}.`;
    if (confidence) {
      summary += ` Learner reported confidence: ${confidence}/5.`;
    }
    return summary;
  }

  /**
   * Determine mastery level based on attempts and accuracy
   */
  static calculateMasteryLevel(scoreRatio: number, attemptsTotal: number): string {
    if (attemptsTotal === 0) return 'not_started';
    if (attemptsTotal < 3 && scoreRatio < 0.5) return 'emerging';
    if (scoreRatio >= 0.85) return 'mastered';
    if (scoreRatio >= 0.65) return 'proficient';
    if (scoreRatio >= 0.40) return 'developing';
    return 'emerging';
  }

  /**
   * Update competency mastery state
   */
  static async updateCompetencyMastery(params: {
    learner_id: string;
    competency_id: string;
    mastery_level?: string;
    mastery_score?: number;
    attempts_total?: number;
    attempts_correct?: number;
    learner_confidence?: number;
    evidence_summary?: string;
  }) {
    // 1. Get existing state if present
    const existingRes = await query(
      `SELECT attempts_total, attempts_correct, learner_confidence, evidence_summary
       FROM learner_competency_states
       WHERE learner_id = $1 AND competency_id = $2`,
      [params.learner_id, params.competency_id]
    );

    const existing = existingRes.rows[0] || { attempts_total: 0, attempts_correct: 0 };
    const newTotal = existing.attempts_total + (params.attempts_total || 0);
    const newCorrect = existing.attempts_correct + (params.attempts_correct || 0);
    const ratio = newTotal > 0 ? Math.min(1.0, Math.max(0.0, newCorrect / newTotal)) : 0;

    const calculatedMastery = params.mastery_level || TwinService.calculateMasteryLevel(ratio, newTotal);
    const calculatedScore = params.mastery_score !== undefined ? params.mastery_score : ratio;
    const confidence = params.learner_confidence !== undefined ? params.learner_confidence : existing.learner_confidence;

    // Fetch topic name for evidence summary
    let topicName = 'this competency';
    const compRes = await query(`SELECT topic FROM competencies WHERE id = $1`, [params.competency_id]);
    if (compRes.rows.length > 0) {
      topicName = compRes.rows[0].topic;
    }

    const evidenceSummary = params.evidence_summary || TwinService.generateEvidenceSummary(topicName, newTotal, newCorrect, confidence);

    const res = await query(
      `INSERT INTO learner_competency_states (
         learner_id, competency_id, mastery_level, mastery_score, attempts_total,
         attempts_correct, learner_confidence, last_practiced_at, review_due_at, evidence_summary, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '7 days', $8, NOW()
       )
       ON CONFLICT (learner_id, competency_id) DO UPDATE
       SET mastery_level = EXCLUDED.mastery_level,
           mastery_score = EXCLUDED.mastery_score,
           attempts_total = EXCLUDED.attempts_total,
           attempts_correct = EXCLUDED.attempts_correct,
           learner_confidence = COALESCE(EXCLUDED.learner_confidence, learner_competency_states.learner_confidence),
           last_practiced_at = NOW(),
           review_due_at = NOW() + INTERVAL '7 days',
           evidence_summary = EXCLUDED.evidence_summary,
           updated_at = NOW()
       RETURNING *`,
      [
        params.learner_id,
        params.competency_id,
        calculatedMastery,
        calculatedScore,
        newTotal,
        newCorrect,
        confidence || null,
        evidenceSummary,
      ]
    );

    return res.rows[0];
  }

  /**
   * Get session events for a learner
   */
  static async getSessionEvents(learnerId: string, options: { session_id?: string; limit?: number; offset?: number }) {
    const { session_id, limit = 50, offset = 0 } = options;
    const params: any[] = [learnerId];
    let sql = `SELECT * FROM session_events WHERE learner_id = $1`;

    if (session_id) {
      params.push(session_id);
      sql += ` AND session_id = $${params.length}`;
    }

    sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Emit session event into session_events log
   */
  static async emitSessionEvent(params: {
    learner_id: string;
    session_id: string;
    event_type: string;
    competency_id?: string;
    resource_id?: string;
    payload?: any;
    tenant_id?: string;
  }) {
    return EventService.ingestEvent({
      event_type: params.event_type,
      session_id: params.session_id,
      learner_id: params.learner_id,
      tenant_id: params.tenant_id,
      competency_id: params.competency_id,
      resource_id: params.resource_id,
      payload: params.payload,
    });
  }

  /**
   * Get learner goals
   */
  static async getGoals(learnerId: string) {
    const res = await query(
      `SELECT * FROM learner_goals WHERE learner_id = $1 ORDER BY created_at DESC`,
      [learnerId]
    );
    return res.rows;
  }

  /**
   * Create a goal for a learner
   */
  static async createGoal(params: {
    learner_id: string;
    goal_type?: string;
    description: string;
    target_date?: string;
  }) {
    const res = await query(
      `INSERT INTO learner_goals (learner_id, goal_type, description, target_date, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [
        params.learner_id,
        params.goal_type || 'academic',
        params.description,
        params.target_date || null,
      ]
    );
    return res.rows[0];
  }

  /**
   * Get learner portfolio items
   */
  static async getPortfolio(learnerId: string) {
    const res = await query(
      `SELECT * FROM portfolio_items WHERE learner_id = $1 ORDER BY created_at DESC`,
      [learnerId]
    );
    return res.rows;
  }

  /**
   * Create portfolio item
   */
  static async createPortfolioItem(params: {
    learner_id: string;
    item_type?: string;
    title: string;
    description?: string;
    file_url?: string;
    competency_ids?: string[];
  }) {
    const res = await query(
      `INSERT INTO portfolio_items (learner_id, item_type, title, description, file_url, competency_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        params.learner_id,
        params.item_type || 'project',
        params.title,
        params.description || null,
        params.file_url || null,
        params.competency_ids || [],
      ]
    );
    return res.rows[0];
  }

  /**
   * Get mentor notes
   */
  static async getMentorNotes(learnerId: string) {
    const res = await query(
      `SELECT mn.*, u.name as mentor_name
       FROM mentor_notes mn
       JOIN users u ON mn.mentor_id = u.id
       WHERE mn.learner_id = $1
       ORDER BY mn.created_at DESC`,
      [learnerId]
    );
    return res.rows;
  }

  /**
   * Add a mentor note
   */
  static async createMentorNote(params: {
    learner_id: string;
    mentor_id: string;
    tenant_id: string;
    session_id?: string;
    competency_id?: string;
    note_type?: string;
    note_text: string;
    is_parent_visible?: boolean;
  }) {
    const res = await query(
      `INSERT INTO mentor_notes (learner_id, mentor_id, tenant_id, session_id, competency_id, note_type, note_text, is_parent_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        params.learner_id,
        params.mentor_id,
        params.tenant_id,
        params.session_id || null,
        params.competency_id || null,
        params.note_type || 'observation',
        params.note_text,
        params.is_parent_visible || false,
      ]
    );
    return res.rows[0];
  }

  /**
   * Update learning twin profile (preferences, pace signal)
   */
  static async updateTwinProfile(learnerId: string, params: {
    preferred_format?: string;
    preferred_session_length_min?: number;
    hint_response?: string;
    pace_signal?: string;
    notes?: string;
  }) {
    const res = await query(
      `INSERT INTO learner_profiles_twin (
         learner_id, preferred_format, preferred_session_length_min, hint_response, pace_signal, notes, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (learner_id) DO UPDATE SET
         preferred_format = COALESCE(EXCLUDED.preferred_format, learner_profiles_twin.preferred_format),
         preferred_session_length_min = COALESCE(EXCLUDED.preferred_session_length_min, learner_profiles_twin.preferred_session_length_min),
         hint_response = COALESCE(EXCLUDED.hint_response, learner_profiles_twin.hint_response),
         pace_signal = COALESCE(EXCLUDED.pace_signal, learner_profiles_twin.pace_signal),
         notes = COALESCE(EXCLUDED.notes, learner_profiles_twin.notes),
         updated_at = NOW()
       RETURNING *`,
      [
        learnerId,
        params.preferred_format || null,
        params.preferred_session_length_min || null,
        params.hint_response || null,
        params.pace_signal || null,
        params.notes || null,
      ]
    );

    return res.rows[0];
  }
}

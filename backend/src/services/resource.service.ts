import { query } from '../db/index.js';

export interface ResourceItem {
  id: string;
  provider_id: string;
  provider_name?: string;
  external_id?: string;
  title: string;
  description?: string;
  format: 'video' | 'article' | 'internal_quiz' | 'interactive' | 'worked_example' | 'audio';
  url?: string;
  embed_url?: string;
  duration_min?: number;
  grade_min?: number;
  grade_max?: number;
  language: string;
  is_age_safe: boolean;
  attribution?: string;
  is_active: boolean;
  fit_type?: string;
}

export interface QuizQuestionItem {
  id: string;
  resource_id: string;
  competency_id?: string;
  question_text: string;
  question_type: string;
  options: { key: string; text: string }[];
  correct_answer?: string;
  explanation?: string;
  difficulty: string;
  grade_level?: number;
  display_order: number;
}

export class ResourceService {
  /**
   * List resources filtered by competency, grade, format
   */
  static async searchResources(params: {
    competency_id?: string;
    grade?: number;
    format?: string;
    limit?: number;
  }) {
    let sql = `
      SELECT r.id, r.provider_id, rp.name as provider_name, r.external_id, r.title,
             r.description, r.format, r.url, r.embed_url, r.duration_min,
             r.grade_min, r.grade_max, r.language, r.is_age_safe, r.attribution,
             r.is_active, r.created_at, rcm.fit_type
      FROM resources r
      JOIN resource_providers rp ON rp.id = r.provider_id
      LEFT JOIN resource_competency_map rcm ON rcm.resource_id = r.id
      WHERE r.is_active = true AND rp.is_active = true
    `;
    const queryParams: any[] = [];

    if (params.competency_id) {
      queryParams.push(params.competency_id);
      sql += ` AND rcm.competency_id = $${queryParams.length}`;
    }

    if (params.grade) {
      queryParams.push(params.grade);
      sql += ` AND (r.grade_min <= $${queryParams.length} AND r.grade_max >= $${queryParams.length})`;
    }

    if (params.format) {
      queryParams.push(params.format);
      sql += ` AND r.format = $${queryParams.length}`;
    }

    sql += ` ORDER BY rcm.fit_type = 'primary' DESC, r.created_at DESC`;
    sql += ` LIMIT $${queryParams.length + 1}`;
    queryParams.push(params.limit || 20);

    const res = await query<ResourceItem>(sql, queryParams);
    return res.rows;
  }

  /**
   * Get resource by ID
   */
  static async getResourceById(id: string) {
    const res = await query<ResourceItem>(
      `SELECT r.id, r.provider_id, rp.name as provider_name, r.external_id, r.title,
              r.description, r.format, r.url, r.embed_url, r.duration_min,
              r.grade_min, r.grade_max, r.language, r.is_age_safe, r.attribution,
              r.is_active, r.created_at
       FROM resources r
       JOIN resource_providers rp ON rp.id = r.provider_id
       WHERE r.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      throw { status: 404, error: 'Resource not found', code: 'NOT_FOUND' };
    }

    return res.rows[0];
  }

  /**
   * Rule-Based Resource Selection Algorithm
   */
  static async selectBestResource(params: {
    learner_id: string;
    competency_id: string;
    preferred_format?: string;
    exclude_resource_ids?: string[];
  }) {
    const excludeIds = params.exclude_resource_ids || [];

    // 1. Fetch candidate resources mapped to competency
    let sql = `
      SELECT r.id, r.provider_id, rp.name as provider_name, r.external_id, r.title,
             r.description, r.format, r.url, r.embed_url, r.duration_min,
             r.grade_min, r.grade_max, r.language, r.is_age_safe, r.attribution,
             rcm.fit_type
      FROM resources r
      JOIN resource_providers rp ON rp.id = r.provider_id
      JOIN resource_competency_map rcm ON rcm.resource_id = r.id
      WHERE rcm.competency_id = $1 AND r.is_active = true AND rp.is_active = true
    `;
    const queryParams: any[] = [params.competency_id];

    if (excludeIds.length > 0) {
      sql += ` AND r.id NOT IN (${excludeIds.map((_, i) => `$${i + 2}`).join(',')})`;
      queryParams.push(...excludeIds);
    }

    const candidatesRes = await query<ResourceItem>(sql, queryParams);
    let candidates = candidatesRes.rows;

    if (candidates.length === 0) {
      return {
        primary: null,
        fallbacks: [],
        escalation_recommended: true,
        reason: 'No suitable candidate resources found for competency',
      };
    }

    // 2. Rank candidates using rule score
    const scoredCandidates = candidates.map((resource) => {
      let score = 0;
      const rationale: string[] = [];

      // Rule A: Primary fit type preference (+30 pts)
      if (resource.fit_type === 'primary') {
        score += 30;
        rationale.push('Primary competency fit');
      }

      // Rule B: Match preferred format (+25 pts)
      if (params.preferred_format && resource.format === params.preferred_format) {
        score += 25;
        rationale.push(`Matches learner format preference (${params.preferred_format})`);
      }

      // Rule C: Short duration preference for engagement (+10 pts)
      if (resource.duration_min && resource.duration_min <= 10) {
        score += 10;
        rationale.push('Bite-sized duration (≤10 min)');
      }

      return {
        resource,
        score,
        rationale: rationale.join('; '),
      };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    const primary = scoredCandidates[0].resource;
    const fallbacks = scoredCandidates.slice(1, 3).map((item) => item.resource);

    return {
      primary,
      fallbacks,
      escalation_recommended: false,
      selection_rationale: scoredCandidates[0].rationale || 'Default competency ranking',
    };
  }

  /**
   * Fetch quiz questions for internal_quiz resource
   */
  static async getQuizQuestions(resourceId: string, includeAnswers = false) {
    const sql = includeAnswers
      ? `SELECT id, resource_id, competency_id, question_text, question_type, options, correct_answer, explanation, difficulty, display_order
         FROM quiz_questions WHERE resource_id = $1 ORDER BY display_order ASC`
      : `SELECT id, resource_id, competency_id, question_text, question_type, options, difficulty, display_order
         FROM quiz_questions WHERE resource_id = $1 ORDER BY display_order ASC`;

    const res = await query<QuizQuestionItem>(sql, [resourceId]);
    return res.rows;
  }

  /**
   * Submit and score internal quiz answers
   */
  static async scoreQuiz(params: {
    resource_id: string;
    learner_id: string;
    answers: { question_id: string; selected_answer: string }[];
  }) {
    const questions = await this.getQuizQuestions(params.resource_id, true);

    let correctCount = 0;
    const itemResults = questions.map((q) => {
      const submitted = params.answers.find((a) => a.question_id === q.id);
      const isCorrect = submitted ? submitted.selected_answer === q.correct_answer : false;
      if (isCorrect) correctCount++;

      return {
        question_id: q.id,
        question_text: q.question_text,
        user_answer: submitted ? submitted.selected_answer : null,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        explanation: q.explanation,
      };
    });

    const scorePercentage = Math.round((correctCount / (questions.length || 1)) * 100);

    return {
      resource_id: params.resource_id,
      total_questions: questions.length,
      correct_count: correctCount,
      score_percentage: scorePercentage,
      passed: scorePercentage >= 70,
      results: itemResults,
    };
  }

  /**
   * List resource providers
   */
  static async listProviders() {
    const res = await query(`SELECT * FROM resource_providers WHERE is_active = true ORDER BY name ASC`);
    return res.rows;
  }
}

import { query } from '../db/index.js';

export interface CreateSessionParams {
  learner_id: string;
  tenant_id: string;
  mentor_id?: string;
  device_id?: string;
  planned_at?: string;
  session_goal?: string;
  total_duration_min?: number;
}

export class SessionService {
  /**
   * Create a new planned session with initial tasks
   */
  static async createSession(params: CreateSessionParams) {
    const plannedDate = params.planned_at || new Date().toISOString().split('T')[0];

    const sessionRes = await query(
      `INSERT INTO sessions (learner_id, tenant_id, mentor_id, device_id, planned_at, status, session_goal, total_duration_min)
       VALUES ($1, $2, $3, $4, $5, 'planned', $6, $7)
       RETURNING *`,
      [
        params.learner_id,
        params.tenant_id,
        params.mentor_id || null,
        params.device_id || null,
        plannedDate,
        params.session_goal || 'Complete daily learning plan objectives',
        params.total_duration_min || 40,
      ]
    );

    const session = sessionRes.rows[0];
    return session;
  }

  /**
   * Auto-Generate today's Session Plan (Rule-based Algorithm)
   */
  static async generateSessionPlan(learnerId: string, tenantId: string) {
    // 1. Fetch competencies needing review or next in learning plan
    const compRes = await query(
      `SELECT c.id as competency_id, c.topic, c.subject, lcs.mastery_level, lcs.review_due_at
       FROM competencies c
       LEFT JOIN learner_competency_states lcs ON lcs.competency_id = c.id AND lcs.learner_id = $1
       ORDER BY (lcs.review_due_at <= NOW()) DESC, c.created_at ASC
       LIMIT 2`,
      [learnerId]
    );

    const competencies = compRes.rows;
    const primaryComp = competencies[0];

    // 2. Create the session
    const session = await this.createSession({
      learner_id: learnerId,
      tenant_id: tenantId,
      session_goal: `Review ${primaryComp?.topic || 'maths'}; learn new concept; practice check questions; reflect.`,
      total_duration_min: 40,
    });

    // 3. Populate 4 standard tasks: review -> learn -> practice -> reflect
    const tasks = [
      {
        session_id: session.id,
        task_order: 1,
        task_type: 'review',
        title: `Quick Review: ${primaryComp?.topic || 'Basic Concepts'}`,
        competency_id: primaryComp?.competency_id || null,
        duration_min: 10,
      },
      {
        session_id: session.id,
        task_order: 2,
        task_type: 'learn',
        title: `Video Lesson: ${primaryComp?.topic || 'Core Topic'}`,
        competency_id: primaryComp?.competency_id || null,
        duration_min: 15,
      },
      {
        session_id: session.id,
        task_order: 3,
        task_type: 'practice',
        title: 'Practice Check Questions (5 Items)',
        competency_id: primaryComp?.competency_id || null,
        duration_min: 10,
      },
      {
        session_id: session.id,
        task_order: 4,
        task_type: 'reflect',
        title: 'Session Reflection & Confidence Check',
        duration_min: 5,
      },
    ];

    for (const t of tasks) {
      await query(
        `INSERT INTO session_tasks (session_id, task_order, task_type, title, competency_id, duration_min, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [t.session_id, t.task_order, t.task_type, t.title, t.competency_id, t.duration_min]
      );
    }

    return this.getSessionDetails(session.id);
  }

  /**
   * Get session details with ordered tasks
   */
  static async getSessionDetails(sessionId: string) {
    const sessionRes = await query(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);

    if (sessionRes.rows.length === 0) {
      throw { status: 404, error: 'Session not found', code: 'NOT_FOUND' };
    }

    const tasksRes = await query(
      `SELECT * FROM session_tasks WHERE session_id = $1 ORDER BY task_order ASC`,
      [sessionId]
    );

    return {
      session: sessionRes.rows[0],
      tasks: tasksRes.rows,
    };
  }

  /**
   * Start session
   */
  static async startSession(sessionId: string) {
    const res = await query(
      `UPDATE sessions SET status = 'active', started_at = NOW() WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    return res.rows[0];
  }

  /**
   * Complete a task in session
   */
  static async updateTaskStatus(taskId: string, status: 'active' | 'completed' | 'skipped') {
    const timeField = status === 'active' ? 'started_at = NOW()' : status === 'completed' ? 'completed_at = NOW()' : '';

    const sql = `
      UPDATE session_tasks
      SET status = $1 ${timeField ? `, ${timeField}` : ''}
      WHERE id = $2
      RETURNING *
    `;

    const res = await query(sql, [status, taskId]);
    return res.rows[0];
  }

  /**
   * End session
   */
  static async endSession(sessionId: string) {
    const res = await query(
      `UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    return res.rows[0];
  }
}

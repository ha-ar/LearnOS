"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const index_js_1 = require("../db/index.js");
class SessionService {
    /**
     * Create a new planned session with initial tasks
     */
    static async createSession(params) {
        const plannedDate = params.planned_at || new Date().toISOString().split('T')[0];
        const sessionRes = await (0, index_js_1.query)(`INSERT INTO sessions (learner_id, tenant_id, mentor_id, device_id, planned_at, status, session_goal, total_duration_min)
       VALUES ($1, $2, $3, $4, $5, 'planned', $6, $7)
       RETURNING *`, [
            params.learner_id,
            params.tenant_id,
            params.mentor_id || null,
            params.device_id || null,
            plannedDate,
            params.session_goal || 'Complete daily learning plan objectives',
            params.total_duration_min || 40,
        ]);
        const session = sessionRes.rows[0];
        return session;
    }
    /**
     * Auto-Generate today's Session Plan (Rule-based Algorithm)
     *
     * Picks competencies scoped to the learner's own grade/curriculum, prioritising
     * whichever the learner is weakest at (lowest mastery score, unattempted counts as
     * weakest) so the plan actually tracks progress instead of always repeating
     * whichever competency happens to sort first.
     */
    static async generateSessionPlan(learnerId, tenantId) {
        // 1. Resolve the learner's own grade + curriculum so we only ever pull
        //    competencies that are actually relevant to them.
        const profileRes = await (0, index_js_1.query)(`SELECT grade, curriculum_id FROM learner_profiles WHERE learner_id = $1`, [learnerId]);
        const grade = profileRes.rows[0]?.grade;
        const curriculumId = profileRes.rows[0]?.curriculum_id;
        // 2. Fetch competencies for this learner's grade/curriculum, prioritising
        //    the weakest mastery (unattempted = treated as weakest to introduce),
        //    with due-for-review as a tiebreaker, then the curriculum's own
        //    teaching order (sequence_order) — falling back to created_at for
        //    older competencies seeded before sequence_order existed.
        const selectCompetencies = (matchGrade) => (0, index_js_1.query)(`SELECT c.id as competency_id, c.topic, c.subject, lcs.mastery_level, lcs.mastery_score, lcs.review_due_at
       FROM competencies c
       LEFT JOIN learner_competency_states lcs ON lcs.competency_id = c.id AND lcs.learner_id = $1
       WHERE c.is_active = true
         AND ($2::uuid IS NULL OR c.curriculum_id = $2)
         AND ($3::text IS NULL OR NOT $4 OR c.grade_level = $3)
       ORDER BY COALESCE(lcs.mastery_score, 0) ASC,
                (lcs.review_due_at IS NOT NULL AND lcs.review_due_at <= NOW()) DESC,
                c.sequence_order ASC NULLS LAST,
                c.created_at ASC
       LIMIT 2`, [learnerId, curriculumId || null, grade || null, matchGrade]);
        // Prefer an exact grade match; if this learner's grade has no seeded
        // competencies yet, fall back to the curriculum at large rather than
        // leaving them with no lesson at all.
        let compRes = await selectCompetencies(true);
        if (compRes.rows.length === 0 && grade) {
            compRes = await selectCompetencies(false);
        }
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
            await (0, index_js_1.query)(`INSERT INTO session_tasks (session_id, task_order, task_type, title, competency_id, duration_min, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`, [t.session_id, t.task_order, t.task_type, t.title, t.competency_id, t.duration_min]);
        }
        return this.getSessionDetails(session.id);
    }
    /**
     * Get session details with ordered tasks
     */
    static async getSessionDetails(sessionId) {
        const sessionRes = await (0, index_js_1.query)(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);
        if (sessionRes.rows.length === 0) {
            throw { status: 404, error: 'Session not found', code: 'NOT_FOUND' };
        }
        const tasksRes = await (0, index_js_1.query)(`SELECT st.*, c.topic, c.subject, c.grade_level
       FROM session_tasks st
       LEFT JOIN competencies c ON c.id = st.competency_id
       WHERE st.session_id = $1
       ORDER BY st.task_order ASC`, [sessionId]);
        return {
            session: sessionRes.rows[0],
            tasks: tasksRes.rows,
        };
    }
    /**
     * Start session
     */
    static async startSession(sessionId) {
        const res = await (0, index_js_1.query)(`UPDATE sessions SET status = 'active', started_at = NOW() WHERE id = $1 RETURNING *`, [sessionId]);
        return res.rows[0];
    }
    /**
     * Complete a task in session
     */
    static async updateTaskStatus(taskId, status) {
        const timeField = status === 'active' ? 'started_at = NOW()' : status === 'completed' ? 'completed_at = NOW()' : '';
        const sql = `
      UPDATE session_tasks
      SET status = $1 ${timeField ? `, ${timeField}` : ''}
      WHERE id = $2
      RETURNING *
    `;
        const res = await (0, index_js_1.query)(sql, [status, taskId]);
        return res.rows[0];
    }
    /**
     * End session
     */
    static async endSession(sessionId) {
        const res = await (0, index_js_1.query)(`UPDATE sessions SET status = 'completed', ended_at = NOW() WHERE id = $1 RETURNING *`, [sessionId]);
        return res.rows[0];
    }
}
exports.SessionService = SessionService;

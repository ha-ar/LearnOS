"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorService = void 0;
const index_js_1 = require("../db/index.js");
class MentorService {
    /**
     * Get live dashboard data for a mentor's learners.
     * Pulls active sessions, event counts, and escalation flags from real DB.
     */
    static async getLiveDashboard(mentorId, tenantId) {
        // 1. Fetch all learners assigned to this mentor
        const learnersRes = await (0, index_js_1.query)(`SELECT u.id, u.name, u.email,
              lp.grade,
              lma.assigned_at
       FROM users u
       JOIN learner_mentor_assignments lma ON lma.learner_id = u.id
       JOIN learner_profiles lp ON lp.learner_id = u.id
       WHERE lma.mentor_id = $1
         AND lma.is_active = true
         AND u.tenant_id = $2
       ORDER BY u.name ASC`, [mentorId, tenantId]);
        const learners = learnersRes.rows;
        // 2. For each learner, enrich with active session + escalation state
        const enriched = await Promise.all(learners.map(async (learner) => {
            // Active session
            const sessionRes = await (0, index_js_1.query)(`SELECT s.id, s.status, s.started_at, s.total_duration_min,
                  st.title as current_task, st.task_type
           FROM sessions s
           LEFT JOIN session_tasks st ON st.session_id = s.id AND st.status = 'active'
           WHERE s.learner_id = $1 AND s.status = 'active'
           ORDER BY s.started_at DESC
           LIMIT 1`, [learner.id]);
            const session = sessionRes.rows[0] || null;
            // AI interaction count this session
            const aiRes = await (0, index_js_1.query)(`SELECT COUNT(*) as count
           FROM session_events
           WHERE learner_id = $1
             AND event_type = 'ai_question_asked'
             AND timestamp > NOW() - INTERVAL '4 hours'`, [learner.id]);
            const aiInteractions = parseInt(aiRes.rows[0]?.count || '0');
            // Pending escalation
            const escRes = await (0, index_js_1.query)(`SELECT id, status FROM escalations
           WHERE learner_id = $1 AND status IN ('pending','attending')
           ORDER BY created_at DESC LIMIT 1`, [learner.id]);
            const escalation = escRes.rows[0] || null;
            // Derive status
            let status = 'on_track';
            if (escalation?.status === 'pending')
                status = 'needs_help';
            else if (aiInteractions >= 4)
                status = 'slow_progress';
            // Time in session
            const timeInSession = session?.started_at
                ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
                : 0;
            return {
                id: learner.id,
                name: learner.name,
                email: learner.email,
                grade: learner.grade,
                status,
                current_task: session?.current_task || null,
                current_topic: null,
                time_in_session_min: timeInSession,
                ai_interactions: aiInteractions,
                escalation_id: escalation?.id || null,
                session_id: session?.id || null,
            };
        }));
        // 3. Pending escalation count
        const pendingEscRes = await (0, index_js_1.query)(`SELECT COUNT(*) as count
       FROM escalations e
       JOIN users u ON u.id = e.learner_id
       WHERE u.tenant_id = $1 AND e.status = 'pending'`, [tenantId]);
        const pendingCount = parseInt(pendingEscRes.rows[0]?.count || '0');
        return {
            learners: enriched,
            pending_escalations: pendingCount,
            session_started_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
            last_updated: new Date().toISOString(),
        };
    }
    /**
     * Get all active/pending escalations for a tenant.
     */
    static async getActiveEscalations(tenantId) {
        const res = await (0, index_js_1.query)(`SELECT e.id, e.learner_id, e.trigger_type, e.brief_text,
              e.ai_suggested_approach, e.status, e.assigned_mentor_id,
              e.attended_at, e.resolved_at, e.resolution_note,
              e.evidence_snapshot, e.created_at,
              u.name as learner_name,
              lp.grade as learner_grade,
              c.topic as competency
       FROM escalations e
       JOIN users u ON u.id = e.learner_id
       JOIN learner_profiles lp ON lp.learner_id = e.learner_id
       LEFT JOIN competencies c ON c.id = e.competency_id
       WHERE u.tenant_id = $1 AND e.status NOT IN ('dismissed','resolved')
       ORDER BY e.created_at DESC`, [tenantId]);
        return { escalations: res.rows, total: res.rows.length };
    }
    /**
     * Get full learner detail for mentor view.
     */
    static async getLearnerDetail(learnerId, tenantId) {
        // Learner profile
        const userRes = await (0, index_js_1.query)(`SELECT u.id, u.name, u.email,
              lp.grade, lp.consent_given
       FROM users u
       JOIN learner_profiles lp ON lp.learner_id = u.id
       WHERE u.id = $1 AND u.tenant_id = $2`, [learnerId, tenantId]);
        if (userRes.rows.length === 0)
            throw { status: 404, error: 'Learner not found', code: 'NOT_FOUND' };
        const learner = userRes.rows[0];
        // Competency states
        const compRes = await (0, index_js_1.query)(`SELECT lcs.competency_id as id, c.topic as name,
              lcs.mastery_level as mastery, lcs.last_practiced_at as last_practiced,
              (lcs.review_due_at <= NOW()) as review_due
       FROM learner_competency_states lcs
       JOIN competencies c ON c.id = lcs.competency_id
       WHERE lcs.learner_id = $1
       ORDER BY lcs.updated_at DESC`, [learnerId]);
        // Recent sessions
        const sessRes = await (0, index_js_1.query)(`SELECT s.id, s.planned_at as date, s.session_goal as topic,
              COUNT(st.id) FILTER (WHERE st.status = 'completed') as completed_tasks,
              COUNT(st.id) as total_tasks,
              s.status as outcome
       FROM sessions s
       LEFT JOIN session_tasks st ON st.session_id = s.id
       WHERE s.learner_id = $1
       GROUP BY s.id
       ORDER BY s.planned_at DESC
       LIMIT 10`, [learnerId]);
        // Active goals
        const goalsRes = await (0, index_js_1.query)(`SELECT id, goal_type, description as text, target_date, status
       FROM learner_goals WHERE learner_id = $1 AND status = 'active'`, [learnerId]);
        return {
            learner,
            competencies: compRes.rows,
            sessions: sessRes.rows,
            goals: goalsRes.rows,
        };
    }
    /**
     * Get today's session events for a learner.
     */
    static async getTodaySession(learnerId) {
        const sessionRes = await (0, index_js_1.query)(`SELECT s.id, s.planned_at as date, s.session_goal as topic, s.status
       FROM sessions s
       WHERE s.learner_id = $1
         AND s.planned_at = CURRENT_DATE
       ORDER BY s.started_at DESC NULLS LAST
       LIMIT 1`, [learnerId]);
        const session = sessionRes.rows[0] || null;
        if (!session) {
            return { session: null, events: [], tasks: [], ai_interactions: 0, check_correct: 0, check_wrong: 0 };
        }
        const eventsRes = await (0, index_js_1.query)(`SELECT id, event_type as type, payload, timestamp as time
       FROM session_events
       WHERE session_id = $1
       ORDER BY timestamp ASC
       LIMIT 50`, [session.id]);
        const tasksRes = await (0, index_js_1.query)(`SELECT id, title, task_type, status
       FROM session_tasks WHERE session_id = $1 ORDER BY task_order ASC`, [session.id]);
        const statsRes = await (0, index_js_1.query)(`SELECT
         COUNT(*) FILTER (WHERE event_type = 'ai_question_asked') as ai_interactions,
         COUNT(*) FILTER (WHERE event_type = 'check_question_correct') as check_correct,
         COUNT(*) FILTER (WHERE event_type = 'check_question_wrong') as check_wrong
       FROM session_events WHERE session_id = $1`, [session.id]);
        const stats = statsRes.rows[0] || {};
        const events = eventsRes.rows.map((e) => ({
            id: e.id,
            type: e.type,
            label: formatEventLabel(e.type, e.payload),
            time: new Date(e.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            color: eventColor(e.type),
        }));
        return {
            session,
            events,
            tasks: tasksRes.rows,
            ai_interactions: parseInt(stats.ai_interactions || '0'),
            check_correct: parseInt(stats.check_correct || '0'),
            check_wrong: parseInt(stats.check_wrong || '0'),
        };
    }
    /**
     * Get mentor notes for a learner.
     */
    static async getNotes(learnerId) {
        const res = await (0, index_js_1.query)(`SELECT mn.id, mn.learner_id, mn.note_type, mn.note_text as text,
              c.topic as competency, mn.created_at,
              u.name as mentor_name
       FROM mentor_notes mn
       JOIN users u ON u.id = mn.mentor_id
       LEFT JOIN competencies c ON c.id = mn.competency_id
       WHERE mn.learner_id = $1
       ORDER BY mn.created_at DESC`, [learnerId]);
        return { notes: res.rows };
    }
    /**
     * Add a mentor note.
     */
    static async addNote(params) {
        const res = await (0, index_js_1.query)(`INSERT INTO mentor_notes (learner_id, mentor_id, note_type, note_text, competency_id, is_parent_visible)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, learner_id, mentor_id, note_type, note_text, is_parent_visible, created_at`, [
            params.learnerId,
            params.mentorId,
            params.noteType || 'observation',
            params.noteText,
            params.competencyId || null,
            params.isParentVisible ?? false,
        ]);
        return { note: res.rows[0] };
    }
    /**
     * Mark escalation as 'attending'.
     */
    static async attendEscalation(escalationId, mentorId) {
        const res = await (0, index_js_1.query)(`UPDATE escalations
       SET status = 'attending', assigned_mentor_id = $2, attended_at = NOW()
       WHERE id = $1
       RETURNING *`, [escalationId, mentorId]);
        if (res.rows.length === 0)
            throw { status: 404, error: 'Escalation not found', code: 'NOT_FOUND' };
        return { success: true, escalation: res.rows[0] };
    }
    /**
     * Resolve escalation with a note.
     */
    static async resolveEscalation(escalationId, mentorId, resolutionNote) {
        const res = await (0, index_js_1.query)(`UPDATE escalations
       SET status = 'resolved', resolved_at = NOW(), resolution_note = $3
       WHERE id = $1 AND assigned_mentor_id = $2
       RETURNING *`, [escalationId, mentorId, resolutionNote || null]);
        if (res.rows.length === 0)
            throw { status: 404, error: 'Escalation not found or not assigned to you', code: 'NOT_FOUND' };
        return { success: true, escalation: res.rows[0] };
    }
    /**
     * Dismiss escalation (not actionable).
     */
    static async dismissEscalation(escalationId, mentorId) {
        const res = await (0, index_js_1.query)(`UPDATE escalations SET status = 'dismissed' WHERE id = $1 RETURNING *`, [escalationId]);
        if (res.rows.length === 0)
            throw { status: 404, error: 'Escalation not found', code: 'NOT_FOUND' };
        return { success: true };
    }
    /**
     * Get weekly summary stats for this mentor.
     */
    static async getSummary(mentorId, tenantId) {
        const sessionsRes = await (0, index_js_1.query)(`SELECT COUNT(*) as count
       FROM sessions s
       JOIN users u ON u.id = s.learner_id
       JOIN learner_mentor_assignments lma ON lma.learner_id = s.learner_id
       WHERE lma.mentor_id = $1
         AND u.tenant_id = $2
         AND s.planned_at >= CURRENT_DATE - INTERVAL '7 days'`, [mentorId, tenantId]);
        const escalationsRes = await (0, index_js_1.query)(`SELECT COUNT(*) as count
       FROM escalations e
       JOIN users u ON u.id = e.learner_id
       WHERE e.assigned_mentor_id = $1
         AND e.status = 'resolved'
         AND e.resolved_at >= NOW() - INTERVAL '7 days'`, [mentorId]);
        const avgRes = await (0, index_js_1.query)(`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60)) as avg_min
       FROM sessions s
       JOIN learner_mentor_assignments lma ON lma.learner_id = s.learner_id
       WHERE lma.mentor_id = $1
         AND s.status = 'completed'
         AND s.ended_at >= NOW() - INTERVAL '7 days'`, [mentorId]);
        const strugglesRes = await (0, index_js_1.query)(`SELECT c.topic, COUNT(*) as count
       FROM session_events se
       JOIN sessions s ON s.id = se.session_id
       JOIN learner_mentor_assignments lma ON lma.learner_id = s.learner_id
       JOIN competencies c ON c.id = se.competency_id
       WHERE lma.mentor_id = $1
         AND se.event_type IN ('check_question_wrong', 'escalation_triggered')
         AND se.timestamp >= NOW() - INTERVAL '7 days'
       GROUP BY c.topic
       ORDER BY count DESC
       LIMIT 5`, [mentorId]);
        return {
            sessions_this_week: parseInt(sessionsRes.rows[0]?.count || '0'),
            escalations_handled: parseInt(escalationsRes.rows[0]?.count || '0'),
            avg_session_min: parseInt(avgRes.rows[0]?.avg_min || '0'),
            top_struggles: strugglesRes.rows.map((r) => ({ topic: r.topic, count: parseInt(r.count) })),
            at_risk_learners: [],
        };
    }
}
exports.MentorService = MentorService;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatEventLabel(eventType, payload) {
    const labels = {
        task_started: `▶ Started task`,
        task_completed: `✅ Task completed`,
        check_question_correct: '✅ Check question answered correctly',
        check_question_wrong: '❌ Check question answered incorrectly',
        check_question_answered: '📝 Check question answered',
        ai_question_asked: '💬 Asked AI companion a question',
        hint_requested: '⚠️ Hint requested',
        escalation_triggered: '🚨 Escalation triggered',
        session_started: '🟢 Session started',
        session_completed: '🏁 Session completed',
        reflection_submitted: '📋 Reflection submitted',
    };
    return labels[eventType] || eventType.replace(/_/g, ' ');
}
function eventColor(eventType) {
    const colors = {
        task_started: 'blue',
        task_completed: 'green',
        check_question_correct: 'green',
        check_question_wrong: 'red',
        check_question_answered: 'gray',
        ai_question_asked: 'purple',
        hint_requested: 'orange',
        escalation_triggered: 'red',
        session_started: 'green',
        session_completed: 'green',
    };
    return colors[eventType] || 'gray';
}

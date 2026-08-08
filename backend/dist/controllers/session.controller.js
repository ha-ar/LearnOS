"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const session_service_js_1 = require("../services/session.service.js");
const index_js_1 = require("../db/index.js");
class SessionController {
    /**
     * POST /api/sessions/generate-plan/:learner_id
     */
    static async generatePlan(req, res) {
        try {
            const { learner_id } = req.params;
            const tenantId = req.user.tenant_id;
            const plan = await session_service_js_1.SessionService.generateSessionPlan(learner_id, tenantId);
            res.status(201).json({ plan });
        }
        catch (err) {
            console.error('Generate session plan error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/sessions/:id
     */
    static async getSession(req, res) {
        try {
            const { id } = req.params;
            const details = await session_service_js_1.SessionService.getSessionDetails(id);
            res.status(200).json(details);
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Get session error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/sessions/:id/start
     */
    static async startSession(req, res) {
        try {
            const { id } = req.params;
            const session = await session_service_js_1.SessionService.startSession(id);
            res.status(200).json({ session });
        }
        catch (err) {
            console.error('Start session error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * PATCH /api/sessions/tasks/:task_id/status
     */
    static async updateTaskStatus(req, res) {
        try {
            const { task_id } = req.params;
            const { status } = req.body;
            if (!status || !['active', 'completed', 'skipped'].includes(status)) {
                res.status(400).json({ error: 'Valid status required (active, completed, skipped)', code: 'INVALID_STATUS' });
                return;
            }
            const task = await session_service_js_1.SessionService.updateTaskStatus(task_id, status);
            res.status(200).json({ task });
        }
        catch (err) {
            console.error('Update task status error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/sessions/:id/end
     */
    static async endSession(req, res) {
        try {
            const { id } = req.params;
            const session = await session_service_js_1.SessionService.endSession(id);
            res.status(200).json({ session });
        }
        catch (err) {
            console.error('End session error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/sessions/:id/exit-app
     * Called by the Flutter kiosk app when the learner requests to exit.
     * Records the exit event and raises an escalation for the assigned mentor.
     * The mentor dashboard will immediately surface this as a priority alert.
     */
    static async notifyAppExit(req, res) {
        try {
            const { id: sessionId } = req.params;
            const { reason = 'Learner requested early exit from kiosk app', elapsed_seconds = 0, tasks_completed = 0, tasks_total = 0, } = req.body;
            const learnerId = req.user.sub;
            const tenantId = req.user.tenant_id;
            // 1. Log the exit event into session_events
            await (0, index_js_1.query)(`INSERT INTO session_events
           (session_id, learner_id, tenant_id, event_type, payload)
         VALUES ($1, $2, $3, 'app_exit_requested', $4)`, [
                sessionId,
                learnerId,
                tenantId,
                JSON.stringify({
                    reason,
                    elapsed_seconds,
                    tasks_completed,
                    tasks_total,
                    exited_at: new Date().toISOString(),
                }),
            ]);
            // 2. Fetch learner name for the brief text
            const userRes = await (0, index_js_1.query)(`SELECT name, grade FROM users u
         LEFT JOIN learner_digital_twins dt ON dt.learner_id = u.id
         WHERE u.id = $1 LIMIT 1`, [learnerId]);
            const learnerName = userRes.rows[0]?.name ?? 'Learner';
            const learnerGrade = userRes.rows[0]?.grade ?? '';
            // 3. Find the assigned mentor for this tenant/learner
            const mentorRes = await (0, index_js_1.query)(`SELECT assigned_mentor_id FROM learner_mentor_assignments
         WHERE learner_id = $1
         ORDER BY assigned_at DESC LIMIT 1`, [learnerId]);
            const mentorId = mentorRes.rows[0]?.assigned_mentor_id ?? null;
            // 4. Create an escalation so the mentor dashboard surfaces this immediately
            const percentDone = tasks_total > 0
                ? Math.round((tasks_completed / tasks_total) * 100)
                : 0;
            const briefText = `⚠️ KIOSK EXIT — ${learnerName} (${learnerGrade}) requested to exit the learning app ` +
                `after ${Math.round(elapsed_seconds / 60)} min. ` +
                `Session progress: ${tasks_completed}/${tasks_total} tasks (${percentDone}%). ` +
                `Reason given: "${reason}". ` +
                `Please verify the learner is supervised and follow up with them.`;
            await (0, index_js_1.query)(`INSERT INTO escalations
           (session_id, learner_id, tenant_id, assigned_mentor_id,
            trigger_type, brief_text, evidence_snapshot, status)
         VALUES ($1, $2, $3, $4, 'system_rule', $5, $6, 'pending')`, [
                sessionId,
                learnerId,
                tenantId,
                mentorId,
                briefText,
                JSON.stringify({
                    exit_reason: reason,
                    elapsed_seconds,
                    tasks_completed,
                    tasks_total,
                    percent_complete: percentDone,
                }),
            ]);
            res.status(200).json({
                success: true,
                message: 'Exit notification sent to mentor.',
                learner_name: learnerName,
                percent_complete: percentDone,
            });
        }
        catch (err) {
            // Still allow exit even if notification fails — don't trap the learner
            console.error('App exit notification error:', err);
            res.status(200).json({
                success: true,
                message: 'Exit logged (notification delivery degraded).',
            });
        }
    }
}
exports.SessionController = SessionController;

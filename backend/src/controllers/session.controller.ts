import { Response } from 'express';
import { SessionService } from '../services/session.service.js';
import { EscalationService } from '../services/escalation.service.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { query } from '../db/index.js';

export class SessionController {
  /**
   * POST /api/sessions/generate-plan/:learner_id
   */
  static async generatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { learner_id } = req.params;
      const tenantId = req.user!.tenant_id;

      const plan = await SessionService.generateSessionPlan(learner_id, tenantId);
      res.status(201).json({ plan });
    } catch (err: any) {
      console.error('Generate session plan error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/sessions/:id
   */
  static async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const details = await SessionService.getSessionDetails(id);
      res.status(200).json(details);
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Get session error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/sessions/:id/start
   */
  static async startSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await SessionService.startSession(id);
      res.status(200).json({ session });
    } catch (err: any) {
      console.error('Start session error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * PATCH /api/sessions/tasks/:task_id/status
   */
  static async updateTaskStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { task_id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'completed', 'skipped'].includes(status)) {
        res.status(400).json({ error: 'Valid status required (active, completed, skipped)', code: 'INVALID_STATUS' });
        return;
      }

      const task = await SessionService.updateTaskStatus(task_id, status);
      res.status(200).json({ task });
    } catch (err: any) {
      console.error('Update task status error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/sessions/:id/end
   */
  static async endSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await SessionService.endSession(id);
      res.status(200).json({ session });
    } catch (err: any) {
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
  static async notifyAppExit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: sessionId } = req.params;
      const {
        reason = 'Learner requested early exit from kiosk app',
        elapsed_seconds = 0,
        tasks_completed = 0,
        tasks_total = 0,
      } = req.body;

      const learnerId  = req.user!.sub;
      const tenantId   = req.user!.tenant_id;

      // 1. Log the exit event into session_events
      await query(
        `INSERT INTO session_events
           (session_id, learner_id, tenant_id, event_type, payload)
         VALUES ($1, $2, $3, 'app_exit_requested', $4)`,
        [
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
        ]
      );

      // 2. Fetch learner name for the brief text
      const userRes = await query(
        `SELECT name, grade FROM users u
         LEFT JOIN learner_digital_twins dt ON dt.learner_id = u.id
         WHERE u.id = $1 LIMIT 1`,
        [learnerId]
      );
      const learnerName  = userRes.rows[0]?.name  ?? 'Learner';
      const learnerGrade = userRes.rows[0]?.grade  ?? '';

      // 3. Create an escalation so the mentor dashboard surfaces this immediately
      const percentDone = tasks_total > 0
        ? Math.round((tasks_completed / tasks_total) * 100)
        : 0;

      const briefText =
        `⚠️ KIOSK EXIT — ${learnerName} (${learnerGrade}) requested to exit the learning app ` +
        `after ${Math.round(elapsed_seconds / 60)} min. ` +
        `Session progress: ${tasks_completed}/${tasks_total} tasks (${percentDone}%). ` +
        `Reason given: "${reason}". ` +
        `Please verify the learner is supervised and follow up with them.`;

      await EscalationService.create({
        session_id: sessionId,
        learner_id: learnerId,
        tenant_id: tenantId,
        trigger_type: 'system_rule',
        brief_text: briefText,
        evidence_snapshot: {
          exit_reason: reason,
          elapsed_seconds,
          tasks_completed,
          tasks_total,
          percent_complete: percentDone,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Exit notification sent to mentor.',
        learner_name: learnerName,
        percent_complete: percentDone,
      });
    } catch (err: any) {
      // Still allow exit even if notification fails — don't trap the learner
      console.error('App exit notification error:', err);
      res.status(200).json({
        success: true,
        message: 'Exit logged (notification delivery degraded).',
      });
    }
  }
}


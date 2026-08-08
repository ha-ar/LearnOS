import { Response } from 'express';
import { ReportService } from '../services/report.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class ReportController {
  /**
   * POST /api/reports/weekly/generate
   * Generate or regenerate weekly report for a learner
   */
  static async generateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learner_id = (req.query.learner_id as string) || req.body?.learner_id || req.user!.sub;
      const week = (req.query.week as string) || req.body?.week || '2026-W30';
      const currentUser = req.user!;

      if (currentUser.role === 'learner' && currentUser.sub !== learner_id) {
        res.status(403).json({ error: 'Unauthorized to generate report for another learner', code: 'FORBIDDEN' });
        return;
      }

      const report = await ReportService.generateWeeklyReport(learner_id, week);
      res.status(201).json({ data: report, report });
    } catch (err: any) {
      console.error('Generate weekly report error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/reports/weekly/latest
   * Fetch most recent weekly report for a learner
   */
  static async getLatest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const learner_id = (req.query.learner_id as string) || (currentUser.role === 'learner' ? currentUser.sub : '10000000-0000-0000-0000-000000000001');

      if (currentUser.role === 'learner' && currentUser.sub !== learner_id) {
        res.status(403).json({ error: 'Unauthorized to view this report', code: 'FORBIDDEN' });
        return;
      }

      const report = await ReportService.getLatestWeeklyReport(learner_id);
      res.status(200).json({ data: report, report });
    } catch (err: any) {
      console.error('Get latest report error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/reports/weekly
   * Fetch weekly report for specific week
   */
  static async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const learner_id = (req.query.learner_id as string) || (currentUser.role === 'learner' ? currentUser.sub : '10000000-0000-0000-0000-000000000001');
      const week = (req.query.week as string) || '2026-W30';

      if (currentUser.role === 'learner' && currentUser.sub !== learner_id) {
        res.status(403).json({ error: 'Unauthorized to view this report', code: 'FORBIDDEN' });
        return;
      }

      const report = await ReportService.getWeeklyReport(learner_id, week);
      res.status(200).json({ data: report, report });
    } catch (err: any) {
      console.error('Get weekly report error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/reports/weekly/list
   * List all available weekly reports for a learner
   */
  static async listReports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const currentUser = req.user!;
      const learner_id = (req.query.learner_id as string) || (currentUser.role === 'learner' ? currentUser.sub : '10000000-0000-0000-0000-000000000001');

      if (currentUser.role === 'learner' && currentUser.sub !== learner_id) {
        res.status(403).json({ error: 'Unauthorized to view report list', code: 'FORBIDDEN' });
        return;
      }

      const reports = await ReportService.listWeeklyReports(learner_id);
      res.status(200).json({ data: reports, reports });
    } catch (err: any) {
      console.error('List weekly reports error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/reports/weekly/send-email
   * Trigger email delivery of weekly report
   */
  static async sendEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learner_id = (req.query.learner_id as string) || req.body?.learner_id || '10000000-0000-0000-0000-000000000001';
      const week = (req.query.week as string) || req.body?.week || '2026-W30';

      const result = await ReportService.sendWeeklyReportEmail(learner_id, week);
      res.status(200).json({ data: result, result });
    } catch (err: any) {
      console.error('Send report email error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

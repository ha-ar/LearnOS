import { Response } from 'express';
import { RecommendationService } from '../services/recommendation.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class RecommendationController {
  /**
   * POST /api/recommendations/next-action
   */
  static async getNextAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { session_id, current_task_id, incorrect_count_this_task, hints_requested, ai_turns } = req.body;
      const learnerId = req.user!.sub;

      if (!session_id) {
        res.status(400).json({ error: 'session_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const recommendation = await RecommendationService.getNextBestAction({
        learner_id: learnerId,
        session_id,
        current_task_id,
        incorrect_count_this_task,
        hints_requested,
        ai_turns,
      });

      res.status(200).json(recommendation);
    } catch (err: any) {
      console.error('Get next action error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/evidence/run
   */
  static async runEvidenceEngine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { session_id } = req.body;
      const learnerId = req.user!.sub;

      if (!session_id) {
        res.status(400).json({ error: 'session_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = await RecommendationService.runEvidenceEngine(session_id, learnerId);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('Run evidence engine error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

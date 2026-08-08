import { Response } from 'express';
import { SafetyService } from '../services/safety.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class SafetyController {
  /**
   * POST /api/safety/check
   */
  static async checkContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: 'text is required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = SafetyService.checkContentSafety(text);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('Check safety error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/consent/:learner_id
   */
  static async verifyConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { learner_id } = req.params;
      const hasConsent = await SafetyService.verifyConsentGate(learner_id);
      res.status(200).json({ learner_id, consent_given: hasConsent });
    } catch (err: any) {
      console.error('Verify consent error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

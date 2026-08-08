import { Response } from 'express';
import { ResourceService } from '../services/resource.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class ResourceController {
  /**
   * GET /api/resources
   */
  static async searchResources(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { competency_id, grade, format, limit } = req.query;

      const resources = await ResourceService.searchResources({
        competency_id: competency_id as string | undefined,
        grade: grade ? parseInt(grade as string, 10) : undefined,
        format: format as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({ resources });
    } catch (err: any) {
      console.error('Search resources error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/resources/:id
   */
  static async getResourceById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resource = await ResourceService.getResourceById(id);
      res.status(200).json({ resource });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Get resource by id error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/resources/select
   */
  static async selectBestResource(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { competency_id, preferred_format, exclude_resource_ids } = req.body;
      const learnerId = req.user!.sub;

      if (!competency_id) {
        res.status(400).json({ error: 'competency_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const selection = await ResourceService.selectBestResource({
        learner_id: learnerId,
        competency_id,
        preferred_format,
        exclude_resource_ids,
      });

      res.status(200).json(selection);
    } catch (err: any) {
      console.error('Select best resource error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/resources/:id/quiz
   */
  static async getQuizQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const questions = await ResourceService.getQuizQuestions(id, false);
      res.status(200).json({ questions });
    } catch (err: any) {
      console.error('Get quiz questions error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/resources/:id/quiz/submit
   */
  static async submitQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { answers } = req.body;
      const learnerId = req.user!.sub;

      if (!answers || !Array.isArray(answers)) {
        res.status(400).json({ error: 'answers array is required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = await ResourceService.scoreQuiz({
        resource_id: id,
        learner_id: learnerId,
        answers,
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/providers
   */
  static async listProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const providers = await ResourceService.listProviders();
      res.status(200).json({ providers });
    } catch (err: any) {
      console.error('List providers error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

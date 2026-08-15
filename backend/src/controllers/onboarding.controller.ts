import { Request, Response } from 'express';
import { OnboardingService } from '../services/onboarding.service.js';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

const PILOT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export class OnboardingController {
  /**
   * Resolve which learner the request targets. Learners always operate on
   * themselves; mentors/admins may pass ?learner_id=.
   */
  private static resolveLearnerId(req: AuthenticatedRequest): string {
    const user = req.user!;
    const queryLearner = req.query.learner_id ? String(req.query.learner_id) : undefined;
    if (user.role === 'learner') return user.sub;
    return queryLearner || user.sub;
  }

  /**
   * POST /api/onboarding/register
   * Public self-registration for a learner. Creates the account and returns
   * auth tokens so the client can proceed straight to the placement test.
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, grade } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: 'name, email and password are required', code: 'MISSING_FIELDS' });
        return;
      }

      await AuthService.createUser({
        email,
        password,
        name,
        role: 'learner',
        tenant_id: PILOT_TENANT_ID,
        grade,
      });

      const result = await AuthService.login(email, password);
      res.status(201).json({ ...result, message: 'Learner registered' });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Onboarding register error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * GET /api/onboarding/placement-test?subject=Mathematics
   */
  static async getPlacementTest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const subject = req.query.subject ? String(req.query.subject) : undefined;
      const test = await OnboardingService.getPlacementTest(subject);
      res.status(200).json(test);
    } catch (err: any) {
      console.error('Get placement test error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/onboarding/placement
   * Body: { grade, subject?, answers: [{question_id, selected}], preferences? }
   */
  static async submitPlacement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learnerId = OnboardingController.resolveLearnerId(req);
      const { grade, subject, answers, preferences } = req.body;

      if (!Array.isArray(answers) || answers.length === 0) {
        res.status(400).json({ error: 'answers array is required', code: 'MISSING_ANSWERS' });
        return;
      }

      const result = await OnboardingService.submitPlacement({
        learner_id: learnerId,
        tenant_id: req.user?.tenant_id,
        grade,
        subject,
        answers,
        preferences,
      });

      res.status(201).json(result);
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Submit placement error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * GET /api/onboarding/next?subject=Mathematics
   */
  static async getNext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learnerId = OnboardingController.resolveLearnerId(req);
      const subject = req.query.subject ? String(req.query.subject) : undefined;
      const recommendation = await OnboardingService.getNextRecommendation(learnerId, subject);
      res.status(200).json({ recommendation });
    } catch (err: any) {
      console.error('Get next recommendation error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/onboarding/start-lesson?subject=Mathematics
   * Generates a focused session plan for the learner's next recommended topic.
   */
  static async startLesson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learnerId = OnboardingController.resolveLearnerId(req);
      const subject = req.query.subject ? String(req.query.subject) : (req.body?.subject as string | undefined);
      const tenantId = req.user?.tenant_id || PILOT_TENANT_ID;
      const result = await OnboardingService.startLesson(learnerId, tenantId, subject);
      res.status(result.started ? 201 : 200).json(result);
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Start lesson error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * GET /api/onboarding/plan?subject=Mathematics
   */
  static async getPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const learnerId = OnboardingController.resolveLearnerId(req);
      const subject = req.query.subject ? String(req.query.subject) : undefined;
      const plan = await OnboardingService.getLearningPlan(learnerId, subject);
      res.status(200).json(plan);
    } catch (err: any) {
      console.error('Get learning plan error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/next-action', RecommendationController.getNextAction);
router.post('/evidence/run', RecommendationController.runEvidenceEngine);

export default router;

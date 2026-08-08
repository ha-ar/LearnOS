import { Router } from 'express';
import { AiController } from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/tutor', AiController.tutorInteraction);
router.post('/hint', AiController.getHint);
router.post('/explain', AiController.explainConcept);
router.post('/lesson', AiController.generateLesson);

export default router;



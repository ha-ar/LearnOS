import { Router } from 'express';
import { SessionController } from '../controllers/session.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/generate-plan/:learner_id', SessionController.generatePlan);
router.get('/:id', SessionController.getSession);
router.post('/:id/start', SessionController.startSession);
router.patch('/tasks/:task_id/status', SessionController.updateTaskStatus);
router.post('/:id/end', SessionController.endSession);
router.post('/:id/exit-app', SessionController.notifyAppExit);

export default router;


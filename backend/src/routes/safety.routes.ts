import { Router } from 'express';
import { SafetyController } from '../controllers/safety.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/check', SafetyController.checkContent);
router.get('/consent/:learner_id', SafetyController.verifyConsent);

export default router;

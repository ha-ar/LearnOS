import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public self-registration for learners
router.post('/register', OnboardingController.register);

// Authenticated onboarding flow
router.get('/placement-test', authenticateToken, OnboardingController.getPlacementTest);
router.post('/placement', authenticateToken, OnboardingController.submitPlacement);
router.get('/next', authenticateToken, OnboardingController.getNext);
router.post('/start-lesson', authenticateToken, OnboardingController.startLesson);
router.get('/plan', authenticateToken, OnboardingController.getPlan);

export default router;

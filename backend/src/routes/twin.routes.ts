import { Router } from 'express';
import { TwinController } from '../controllers/twin.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Digital Twin Summary & Competency Reads
router.get('/:learner_id', TwinController.getTwinSummary);
router.get('/:learner_id/competencies', TwinController.getCompetencies);
router.get('/:learner_id/competencies/:competency_id', TwinController.getCompetencyById);
router.patch('/:learner_id/competencies/:competency_id', requireRole(['mentor', 'admin', 'superadmin']), TwinController.updateCompetency);

// Session Events
router.get('/:learner_id/session-events', TwinController.getSessionEvents);
router.post('/:learner_id/events', TwinController.emitSessionEvent);

// Goals
router.get('/:learner_id/goals', TwinController.getGoals);
router.post('/:learner_id/goals', TwinController.createGoal);

// Portfolio
router.get('/:learner_id/portfolio', TwinController.getPortfolio);
router.post('/:learner_id/portfolio', TwinController.createPortfolioItem);

// Mentor Notes
router.get('/:learner_id/mentor-notes', TwinController.getMentorNotes);
router.post('/:learner_id/mentor-notes', requireRole(['mentor', 'admin', 'superadmin']), TwinController.createMentorNote);

// Profile
router.patch('/:learner_id/profile', requireRole(['mentor', 'admin', 'superadmin']), TwinController.updateTwinProfile);

export default router;

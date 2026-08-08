import { Router } from 'express';
import { MentorController } from '../controllers/mentor.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All mentor routes require authentication + mentor/admin role
router.use(authenticateToken);
router.use(requireRole(['mentor', 'admin', 'superadmin']));

// Dashboard overview
router.get('/dashboard', MentorController.getDashboard);

// Escalation queue
router.get('/escalations', MentorController.getEscalations);
router.post('/escalations/:id/attend', MentorController.attendEscalation);
router.post('/escalations/:id/resolve', MentorController.resolveEscalation);
router.post('/escalations/:id/dismiss', MentorController.dismissEscalation);

// Learner management
router.get('/learners', MentorController.getLearners);
router.get('/learners/:id', MentorController.getLearnerDetail);
router.get('/learners/:id/session/today', MentorController.getTodaySession);
router.get('/learners/:id/notes', MentorController.getNotes);
router.post('/learners/:id/notes', MentorController.addNote);

// Weekly summary
router.get('/summary', MentorController.getSummary);

export default router;

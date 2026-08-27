"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const twin_controller_js_1 = require("../controllers/twin.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticateToken);
// Digital Twin Summary & Competency Reads
router.get('/:learner_id', twin_controller_js_1.TwinController.getTwinSummary);
router.get('/:learner_id/course-progress', twin_controller_js_1.TwinController.getCourseProgress);
router.get('/:learner_id/competencies', twin_controller_js_1.TwinController.getCompetencies);
router.get('/:learner_id/competencies/:competency_id', twin_controller_js_1.TwinController.getCompetencyById);
router.patch('/:learner_id/competencies/:competency_id', (0, auth_js_1.requireRole)(['mentor', 'admin', 'superadmin']), twin_controller_js_1.TwinController.updateCompetency);
// Session Events
router.get('/:learner_id/session-events', twin_controller_js_1.TwinController.getSessionEvents);
router.post('/:learner_id/events', twin_controller_js_1.TwinController.emitSessionEvent);
// Goals
router.get('/:learner_id/goals', twin_controller_js_1.TwinController.getGoals);
router.post('/:learner_id/goals', twin_controller_js_1.TwinController.createGoal);
// Portfolio
router.get('/:learner_id/portfolio', twin_controller_js_1.TwinController.getPortfolio);
router.post('/:learner_id/portfolio', twin_controller_js_1.TwinController.createPortfolioItem);
// Mentor Notes
router.get('/:learner_id/mentor-notes', twin_controller_js_1.TwinController.getMentorNotes);
router.post('/:learner_id/mentor-notes', (0, auth_js_1.requireRole)(['mentor', 'admin', 'superadmin']), twin_controller_js_1.TwinController.createMentorNote);
// Profile
router.patch('/:learner_id/profile', (0, auth_js_1.requireRole)(['mentor', 'admin', 'superadmin']), twin_controller_js_1.TwinController.updateTwinProfile);
exports.default = router;

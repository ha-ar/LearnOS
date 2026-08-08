"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mentor_controller_js_1 = require("../controllers/mentor.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All mentor routes require authentication + mentor/admin role
router.use(auth_js_1.authenticateToken);
router.use((0, auth_js_1.requireRole)(['mentor', 'admin', 'superadmin']));
// Dashboard overview
router.get('/dashboard', mentor_controller_js_1.MentorController.getDashboard);
// Escalation queue
router.get('/escalations', mentor_controller_js_1.MentorController.getEscalations);
router.post('/escalations/:id/attend', mentor_controller_js_1.MentorController.attendEscalation);
router.post('/escalations/:id/resolve', mentor_controller_js_1.MentorController.resolveEscalation);
router.post('/escalations/:id/dismiss', mentor_controller_js_1.MentorController.dismissEscalation);
// Learner management
router.get('/learners', mentor_controller_js_1.MentorController.getLearners);
router.get('/learners/:id', mentor_controller_js_1.MentorController.getLearnerDetail);
router.get('/learners/:id/session/today', mentor_controller_js_1.MentorController.getTodaySession);
router.get('/learners/:id/notes', mentor_controller_js_1.MentorController.getNotes);
router.post('/learners/:id/notes', mentor_controller_js_1.MentorController.addNote);
// Weekly summary
router.get('/summary', mentor_controller_js_1.MentorController.getSummary);
exports.default = router;

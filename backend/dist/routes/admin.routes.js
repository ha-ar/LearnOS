"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All admin routes require authenticated token with admin or superadmin role
router.use(auth_js_1.authenticateToken);
router.use((0, auth_js_1.requireRole)(['admin', 'superadmin']));
// User Management
router.get('/users', admin_controller_js_1.AdminController.listUsers);
router.post('/users', admin_controller_js_1.AdminController.createUser);
router.get('/users/:id', admin_controller_js_1.AdminController.getUserById);
router.patch('/users/:id', admin_controller_js_1.AdminController.updateUser);
router.delete('/users/:id', admin_controller_js_1.AdminController.deactivateUser);
router.post('/users/assign-mentor', admin_controller_js_1.AdminController.assignMentor);
router.post('/users/assign-parent', admin_controller_js_1.AdminController.assignParent);
// Device Management
router.get('/devices', admin_controller_js_1.AdminController.listDevices);
router.post('/devices/register', admin_controller_js_1.AdminController.registerDevice);
router.patch('/devices/:id', admin_controller_js_1.AdminController.updateDevice);
router.delete('/devices/:id', admin_controller_js_1.AdminController.deactivateDevice);
// Curriculum & Tenant Config
router.get('/config/curricula', admin_controller_js_1.AdminController.listCurricula);
router.get('/config/active', admin_controller_js_1.AdminController.getTenantConfig);
router.post('/config/curricula/activate', admin_controller_js_1.AdminController.activateCurriculum);
// Dashboard Metrics & Risk Detection
router.get('/dashboard', admin_controller_js_1.AdminController.getDashboard);
router.get('/dashboard/at-risk-learners', admin_controller_js_1.AdminController.getAtRiskLearners);
// Consent & Compliance
router.get('/consent', admin_controller_js_1.AdminController.listConsent);
router.post('/consent/:learner_id', admin_controller_js_1.AdminController.recordConsent);
router.post('/data-export/:learner_id', admin_controller_js_1.AdminController.createDataExport);
router.post('/data-deletion/:learner_id', admin_controller_js_1.AdminController.createDataDeletion);
// Audit Logs
router.get('/audit-log/export', admin_controller_js_1.AdminController.exportAuditLogsCsv);
router.get('/audit-log', admin_controller_js_1.AdminController.getAuditLogs);
exports.default = router;

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authenticated token with admin or superadmin role
router.use(authenticateToken);
router.use(requireRole(['admin', 'superadmin']));

// User Management
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deactivateUser);
router.post('/users/assign-mentor', AdminController.assignMentor);
router.post('/users/assign-parent', AdminController.assignParent);

// Device Management
router.get('/devices', AdminController.listDevices);
router.post('/devices/register', AdminController.registerDevice);
router.patch('/devices/:id', AdminController.updateDevice);
router.delete('/devices/:id', AdminController.deactivateDevice);

// Curriculum & Tenant Config
router.get('/config/curricula', AdminController.listCurricula);
router.get('/config/active', AdminController.getTenantConfig);
router.post('/config/curricula/activate', AdminController.activateCurriculum);

// Dashboard Metrics & Risk Detection
router.get('/dashboard', AdminController.getDashboard);
router.get('/dashboard/at-risk-learners', AdminController.getAtRiskLearners);

// Consent & Compliance
router.get('/consent', AdminController.listConsent);
router.post('/consent/:learner_id', AdminController.recordConsent);
router.post('/data-export/:learner_id', AdminController.createDataExport);
router.post('/data-deletion/:learner_id', AdminController.createDataDeletion);

// Audit Logs
router.get('/audit-log/export', AdminController.exportAuditLogsCsv);
router.get('/audit-log', AdminController.getAuditLogs);

export default router;

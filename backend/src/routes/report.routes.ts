import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/weekly/generate', ReportController.generateReport);
router.get('/weekly/latest', ReportController.getLatest);
router.get('/weekly/list', ReportController.listReports);
router.post('/weekly/send-email', ReportController.sendEmail);
router.get('/weekly', ReportController.getReport);

export default router;

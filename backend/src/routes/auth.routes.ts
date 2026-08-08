import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);

// Device registration (Admin only)
router.post('/device/register', authenticateToken, requireRole(['admin', 'superadmin']), AuthController.registerDevice);

export default router;

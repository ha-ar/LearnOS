import { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { query } from '../db/index.js';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role = 'learner', grade } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, password, and name are required', code: 'MISSING_FIELDS' });
        return;
      }

      // Default pilot centre tenant
      const tenantId = '00000000-0000-0000-0000-000000000001';

      const user = await AuthService.createUser({
        email,
        password,
        name,
        role,
        tenant_id: tenantId,
        grade,
      });

      res.status(201).json({ user, message: 'Account registered successfully' });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, device_id } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = await AuthService.login(email, password, device_id);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({ error: 'Refresh token is required', code: 'MISSING_TOKEN' });
        return;
      }

      const result = await AuthService.refreshToken(refresh_token);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Refresh error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;
      const user = req.user!;

      await AuthService.logout(refresh_token, user.sub, user.tenant_id);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err: any) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/auth/me
   */
  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const userRes = await query(
        `SELECT id, email, name, role, tenant_id, is_active, created_at
         FROM users WHERE id = $1`,
        [user.sub]
      );

      if (userRes.rows.length === 0) {
        res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
        return;
      }

      const userInfo: any = userRes.rows[0];

      // If user is learner, attach profile info
      if (userInfo.role === 'learner') {
        const profileRes = await query(
          `SELECT guardian_id, grade, curriculum_id, consent_given, consent_given_at
           FROM learner_profiles WHERE learner_id = $1`,
          [user.sub]
        );
        userInfo.profile = profileRes.rows[0] || null;
      }

      res.status(200).json({ user: userInfo });
    } catch (err: any) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/auth/device/register
   */
  static async registerDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, room, platform } = req.body;
      const tenantId = req.user!.tenant_id;

      if (!name) {
        res.status(400).json({ error: 'Device name is required', code: 'MISSING_FIELDS' });
        return;
      }

      const device = await AuthService.registerDevice({
        name,
        room,
        tenant_id: tenantId,
        platform,
      });

      res.status(201).json({ device });
    } catch (err: any) {
      console.error('Register device error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

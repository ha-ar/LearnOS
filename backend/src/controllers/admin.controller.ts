import { Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { query } from '../db/index.js';

export class AdminController {
  /**
   * GET /api/admin/users
   */
  static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const roleFilter = req.query.role as string | undefined;

      let sql = `
        SELECT u.id, u.email, u.name, u.role, u.tenant_id, u.is_active, u.created_at,
               lp.grade, lp.consent_given, lp.guardian_id,
               g.name as guardian_name, m.name as mentor_name
        FROM users u
        LEFT JOIN learner_profiles lp ON lp.learner_id = u.id
        LEFT JOIN users g ON g.id = lp.guardian_id
        LEFT JOIN learner_mentor_assignments lma ON lma.learner_id = u.id AND lma.is_active = true
        LEFT JOIN users m ON m.id = lma.mentor_id
        WHERE u.tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (roleFilter) {
        sql += ` AND u.role = $2`;
        params.push(roleFilter);
      }

      sql += ` ORDER BY u.created_at DESC`;

      const usersRes = await query(sql, params);
      res.status(200).json({ users: usersRes.rows });
    } catch (err: any) {
      console.error('List users error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { id } = req.params;
      const user = await AdminService.getUserById(tenantId, id);
      res.status(200).json({ user });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/admin/users
   */
  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role, grade, guardian_id } = req.body;
      const tenantId = req.user!.tenant_id;

      if (!email || !password || !name || !role) {
        res.status(400).json({ error: 'email, password, name, and role are required', code: 'MISSING_FIELDS' });
        return;
      }

      const newUser = await AuthService.createUser({
        email,
        password,
        name,
        role,
        tenant_id: tenantId,
        grade,
        guardian_id,
      });

      await AdminService.logAction({
        actor_id: req.user!.sub,
        actor_role: req.user!.role,
        tenant_id: tenantId,
        action: 'user.create',
        resource_type: 'user',
        resource_id: newUser.id,
        payload_summary: `Created user ${name} (${role})`,
      });

      res.status(201).json({ user: newUser });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * PATCH /api/admin/users/:id
   */
  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { id } = req.params;
      const updated = await AdminService.updateUser(tenantId, id, req.body, req.user!.sub);
      res.status(200).json({ user: updated });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * DELETE /api/admin/users/:id
   */
  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { id } = req.params;
      const deactivated = await AdminService.deactivateUser(tenantId, id, req.user!.sub);
      res.status(200).json({ user: deactivated, message: 'User deactivated successfully' });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Deactivate user error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/admin/users/assign-mentor
   */
  static async assignMentor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { learner_id, mentor_id } = req.body;

      if (!learner_id || !mentor_id) {
        res.status(400).json({ error: 'learner_id and mentor_id are required', code: 'MISSING_FIELDS' });
        return;
      }

      const assignment = await AdminService.assignMentor(tenantId, learner_id, mentor_id, req.user!.sub);
      res.status(200).json({ assignment });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Assign mentor error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * POST /api/admin/users/assign-parent
   */
  static async assignParent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { learner_id, parent_id, consent_given } = req.body;

      if (!learner_id || !parent_id) {
        res.status(400).json({ error: 'learner_id and parent_id are required', code: 'MISSING_FIELDS' });
        return;
      }

      const profile = await AdminService.assignParent(tenantId, learner_id, parent_id, !!consent_given, req.user!.sub);
      res.status(200).json({ profile });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Assign parent error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * GET /api/admin/devices
   */
  static async listDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const devices = await AdminService.listDevices(tenantId);
      res.status(200).json({ devices });
    } catch (err: any) {
      console.error('List devices error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/devices/register
   */
  static async registerDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { name, room, platform, os_version } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Device name is required', code: 'MISSING_FIELDS' });
        return;
      }

      const device = await AdminService.registerDevice(tenantId, { name, room, platform, os_version }, req.user!.sub);
      res.status(201).json({ device });
    } catch (err: any) {
      console.error('Register device error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * PATCH /api/admin/devices/:id
   */
  static async updateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { id } = req.params;
      const device = await AdminService.updateDevice(tenantId, id, req.body, req.user!.sub);
      res.status(200).json({ device });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Update device error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * DELETE /api/admin/devices/:id
   */
  static async deactivateDevice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { id } = req.params;
      const device = await AdminService.deactivateDevice(tenantId, id, req.user!.sub);
      res.status(200).json({ device });
    } catch (err: any) {
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        console.error('Deactivate device error:', err);
        res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
      }
    }
  }

  /**
   * GET /api/admin/config/curricula
   */
  static async listCurricula(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const curricula = await AdminService.listCurricula();
      res.status(200).json({ curricula });
    } catch (err: any) {
      console.error('List curricula error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/config/active
   */
  static async getTenantConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const config = await AdminService.getTenantConfig(tenantId);
      res.status(200).json({ config });
    } catch (err: any) {
      console.error('Get tenant config error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/config/curricula/activate
   */
  static async activateCurriculum(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { curriculum_id, subjects, grade_min, grade_max } = req.body;

      if (!curriculum_id) {
        res.status(400).json({ error: 'curriculum_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const config = await AdminService.activateCurriculum(tenantId, { curriculum_id, subjects, grade_min, grade_max }, req.user!.sub);
      res.status(200).json({ config });
    } catch (err: any) {
      console.error('Activate curriculum error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/dashboard
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const stats = await AdminService.getDashboardStats(tenantId);
      res.status(200).json({ dashboard: stats });
    } catch (err: any) {
      console.error('Get admin dashboard error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/dashboard/at-risk-learners
   */
  static async getAtRiskLearners(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const atRisk = await AdminService.getAtRiskLearners(tenantId);
      res.status(200).json({ at_risk_learners: atRisk });
    } catch (err: any) {
      console.error('Get at risk learners error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/consent
   */
  static async listConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const consentRecords = await AdminService.listConsentRecords(tenantId);
      res.status(200).json({ consent_records: consentRecords });
    } catch (err: any) {
      console.error('List consent error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/consent/:learner_id
   */
  static async recordConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { learner_id } = req.params;
      const { guardian_id, consent_version, data_scope } = req.body;

      if (!guardian_id) {
        res.status(400).json({ error: 'guardian_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const record = await AuthService.recordConsent({
        learner_id,
        guardian_id,
        consent_version,
        data_scope,
        admin_id: req.user!.sub,
      });

      await AdminService.logAction({
        actor_id: req.user!.sub,
        actor_role: req.user!.role,
        tenant_id: req.user!.tenant_id,
        action: 'consent.record',
        resource_type: 'consent',
        resource_id: learner_id,
        payload_summary: `Recorded consent for learner ${learner_id}`,
      });

      res.status(200).json({ consent_record: record });
    } catch (err: any) {
      console.error('Record consent error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/data-export/:learner_id
   */
  static async createDataExport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { learner_id } = req.params;
      const request = await AdminService.createDataExportRequest(tenantId, learner_id, req.user!.sub);
      res.status(201).json({ data_request: request });
    } catch (err: any) {
      console.error('Create data export error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/admin/data-deletion/:learner_id
   */
  static async createDataDeletion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { learner_id } = req.params;
      const request = await AdminService.createDataDeletionRequest(tenantId, learner_id, req.user!.sub);
      res.status(201).json({ data_request: request });
    } catch (err: any) {
      console.error('Create data deletion error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/audit-log
   */
  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const { user_id, action, from, to, limit } = req.query;

      const logs = await AdminService.getAuditLogs(tenantId, {
        userId: user_id ? String(user_id) : undefined,
        action: action ? String(action) : undefined,
        fromDate: from ? String(from) : undefined,
        toDate: to ? String(to) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 100,
      });

      res.status(200).json({ audit_logs: logs });
    } catch (err: any) {
      console.error('Get audit log error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/admin/audit-log/export
   */
  static async exportAuditLogsCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenant_id;
      const csv = await AdminService.exportAuditLogsCsv(tenantId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');
      res.status(200).send(csv);
    } catch (err: any) {
      console.error('Export audit log CSV error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

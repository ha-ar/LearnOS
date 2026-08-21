"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_js_1 = require("../services/admin.service.js");
const auth_service_js_1 = require("../services/auth.service.js");
const index_js_1 = require("../db/index.js");
class AdminController {
    /**
     * GET /api/admin/users
     */
    static async listUsers(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const roleFilter = req.query.role;
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
            const params = [tenantId];
            if (roleFilter) {
                sql += ` AND u.role = $2`;
                params.push(roleFilter);
            }
            sql += ` ORDER BY u.created_at DESC`;
            const usersRes = await (0, index_js_1.query)(sql, params);
            res.status(200).json({ users: usersRes.rows });
        }
        catch (err) {
            console.error('List users error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/users/:id
     */
    static async getUserById(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { id } = req.params;
            const user = await admin_service_js_1.AdminService.getUserById(tenantId, id);
            res.status(200).json({ user });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Get user error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/admin/users
     */
    static async createUser(req, res) {
        try {
            const { email, password, name, role, grade, guardian_id, curriculum_id } = req.body;
            const tenantId = req.user.tenant_id;
            if (!email || !password || !name || !role) {
                res.status(400).json({ error: 'email, password, name, and role are required', code: 'MISSING_FIELDS' });
                return;
            }
            const newUser = await auth_service_js_1.AuthService.createUser({
                email,
                password,
                name,
                role,
                tenant_id: tenantId,
                grade,
                guardian_id,
                curriculum_id,
            });
            await admin_service_js_1.AdminService.logAction({
                actor_id: req.user.sub,
                actor_role: req.user.role,
                tenant_id: tenantId,
                action: 'user.create',
                resource_type: 'user',
                resource_id: newUser.id,
                payload_summary: `Created user ${name} (${role})`,
            });
            res.status(201).json({ user: newUser });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Create user error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * PATCH /api/admin/users/:id
     */
    static async updateUser(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { id } = req.params;
            const updated = await admin_service_js_1.AdminService.updateUser(tenantId, id, req.body, req.user.sub);
            res.status(200).json({ user: updated });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Update user error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * DELETE /api/admin/users/:id
     */
    static async deactivateUser(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { id } = req.params;
            const deactivated = await admin_service_js_1.AdminService.deactivateUser(tenantId, id, req.user.sub);
            res.status(200).json({ user: deactivated, message: 'User deactivated successfully' });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Deactivate user error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/admin/users/assign-mentor
     */
    static async assignMentor(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { learner_id, mentor_id } = req.body;
            if (!learner_id || !mentor_id) {
                res.status(400).json({ error: 'learner_id and mentor_id are required', code: 'MISSING_FIELDS' });
                return;
            }
            const assignment = await admin_service_js_1.AdminService.assignMentor(tenantId, learner_id, mentor_id, req.user.sub);
            res.status(200).json({ assignment });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Assign mentor error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/admin/users/assign-parent
     */
    static async assignParent(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { learner_id, parent_id, consent_given } = req.body;
            if (!learner_id || !parent_id) {
                res.status(400).json({ error: 'learner_id and parent_id are required', code: 'MISSING_FIELDS' });
                return;
            }
            const profile = await admin_service_js_1.AdminService.assignParent(tenantId, learner_id, parent_id, !!consent_given, req.user.sub);
            res.status(200).json({ profile });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Assign parent error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * GET /api/admin/devices
     */
    static async listDevices(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const devices = await admin_service_js_1.AdminService.listDevices(tenantId);
            res.status(200).json({ devices });
        }
        catch (err) {
            console.error('List devices error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/admin/devices/register
     */
    static async registerDevice(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { name, room, platform, os_version } = req.body;
            if (!name) {
                res.status(400).json({ error: 'Device name is required', code: 'MISSING_FIELDS' });
                return;
            }
            const device = await admin_service_js_1.AdminService.registerDevice(tenantId, { name, room, platform, os_version }, req.user.sub);
            res.status(201).json({ device });
        }
        catch (err) {
            console.error('Register device error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * PATCH /api/admin/devices/:id
     */
    static async updateDevice(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { id } = req.params;
            const device = await admin_service_js_1.AdminService.updateDevice(tenantId, id, req.body, req.user.sub);
            res.status(200).json({ device });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Update device error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * DELETE /api/admin/devices/:id
     */
    static async deactivateDevice(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { id } = req.params;
            const device = await admin_service_js_1.AdminService.deactivateDevice(tenantId, id, req.user.sub);
            res.status(200).json({ device });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Deactivate device error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * GET /api/admin/config/curricula
     */
    static async listCurricula(req, res) {
        try {
            const curricula = await admin_service_js_1.AdminService.listCurricula();
            res.status(200).json({ curricula });
        }
        catch (err) {
            console.error('List curricula error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/config/active
     */
    static async getTenantConfig(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const config = await admin_service_js_1.AdminService.getTenantConfig(tenantId);
            res.status(200).json({ config });
        }
        catch (err) {
            console.error('Get tenant config error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/admin/config/curricula/activate
     */
    static async activateCurriculum(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { curriculum_id, subjects, grade_min, grade_max } = req.body;
            if (!curriculum_id) {
                res.status(400).json({ error: 'curriculum_id is required', code: 'MISSING_FIELDS' });
                return;
            }
            const config = await admin_service_js_1.AdminService.activateCurriculum(tenantId, { curriculum_id, subjects, grade_min, grade_max }, req.user.sub);
            res.status(200).json({ config });
        }
        catch (err) {
            console.error('Activate curriculum error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/dashboard
     */
    static async getDashboard(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const stats = await admin_service_js_1.AdminService.getDashboardStats(tenantId);
            res.status(200).json({ dashboard: stats });
        }
        catch (err) {
            console.error('Get admin dashboard error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/dashboard/at-risk-learners
     */
    static async getAtRiskLearners(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const atRisk = await admin_service_js_1.AdminService.getAtRiskLearners(tenantId);
            res.status(200).json({ at_risk_learners: atRisk });
        }
        catch (err) {
            console.error('Get at risk learners error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/consent
     */
    static async listConsent(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const consentRecords = await admin_service_js_1.AdminService.listConsentRecords(tenantId);
            res.status(200).json({ consent_records: consentRecords });
        }
        catch (err) {
            console.error('List consent error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/admin/consent/:learner_id
     */
    static async recordConsent(req, res) {
        try {
            const { learner_id } = req.params;
            const { guardian_id, consent_version, data_scope } = req.body;
            if (!guardian_id) {
                res.status(400).json({ error: 'guardian_id is required', code: 'MISSING_FIELDS' });
                return;
            }
            const record = await auth_service_js_1.AuthService.recordConsent({
                learner_id,
                guardian_id,
                consent_version,
                data_scope,
                admin_id: req.user.sub,
            });
            await admin_service_js_1.AdminService.logAction({
                actor_id: req.user.sub,
                actor_role: req.user.role,
                tenant_id: req.user.tenant_id,
                action: 'consent.record',
                resource_type: 'consent',
                resource_id: learner_id,
                payload_summary: `Recorded consent for learner ${learner_id}`,
            });
            res.status(200).json({ consent_record: record });
        }
        catch (err) {
            console.error('Record consent error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/admin/data-export/:learner_id
     */
    static async createDataExport(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { learner_id } = req.params;
            const request = await admin_service_js_1.AdminService.createDataExportRequest(tenantId, learner_id, req.user.sub);
            res.status(201).json({ data_request: request });
        }
        catch (err) {
            console.error('Create data export error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/admin/data-deletion/:learner_id
     */
    static async createDataDeletion(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { learner_id } = req.params;
            const request = await admin_service_js_1.AdminService.createDataDeletionRequest(tenantId, learner_id, req.user.sub);
            res.status(201).json({ data_request: request });
        }
        catch (err) {
            console.error('Create data deletion error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/audit-log
     */
    static async getAuditLogs(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const { user_id, action, from, to, limit } = req.query;
            const logs = await admin_service_js_1.AdminService.getAuditLogs(tenantId, {
                userId: user_id ? String(user_id) : undefined,
                action: action ? String(action) : undefined,
                fromDate: from ? String(from) : undefined,
                toDate: to ? String(to) : undefined,
                limit: limit ? parseInt(String(limit), 10) : 100,
            });
            res.status(200).json({ audit_logs: logs });
        }
        catch (err) {
            console.error('Get audit log error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/admin/audit-log/export
     */
    static async exportAuditLogsCsv(req, res) {
        try {
            const tenantId = req.user.tenant_id;
            const csv = await admin_service_js_1.AdminService.exportAuditLogsCsv(tenantId);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');
            res.status(200).send(csv);
        }
        catch (err) {
            console.error('Export audit log CSV error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.AdminController = AdminController;

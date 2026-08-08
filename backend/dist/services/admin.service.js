"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../db/index.js");
class AdminService {
    /**
     * Write to immutable audit log
     */
    static async logAction(params) {
        await (0, index_js_1.query)(`INSERT INTO audit_log (actor_id, actor_role, tenant_id, action, resource_type, resource_id, payload_summary, result, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`, [
            params.actor_id,
            params.actor_role,
            params.tenant_id,
            params.action,
            params.resource_type || null,
            params.resource_id || null,
            params.payload_summary || null,
            params.result || 'success',
            params.reason || null,
        ]);
    }
    /**
     * User Management: Get user details by ID
     */
    static async getUserById(tenantId, userId) {
        const res = await (0, index_js_1.query)(`SELECT u.id, u.email, u.name, u.role, u.tenant_id, u.is_active, u.created_at, u.updated_at,
              lp.grade, lp.guardian_id, lp.consent_given, lp.consent_given_at,
              lma.mentor_id
       FROM users u
       LEFT JOIN learner_profiles lp ON lp.learner_id = u.id
       LEFT JOIN learner_mentor_assignments lma ON lma.learner_id = u.id AND lma.is_active = true
       WHERE u.id = $1 AND u.tenant_id = $2`, [userId, tenantId]);
        if (res.rows.length === 0) {
            throw { status: 404, error: 'User not found', code: 'NOT_FOUND' };
        }
        return res.rows[0];
    }
    /**
     * User Management: Update user details
     */
    static async updateUser(tenantId, userId, params, adminId) {
        const userRes = await (0, index_js_1.query)(`SELECT * FROM users WHERE id = $1 AND tenant_id = $2`, [userId, tenantId]);
        if (userRes.rows.length === 0) {
            throw { status: 404, error: 'User not found', code: 'NOT_FOUND' };
        }
        if (params.name || params.role !== undefined || params.is_active !== undefined) {
            await (0, index_js_1.query)(`UPDATE users
         SET name = COALESCE($1, name),
             role = COALESCE($2, role),
             is_active = COALESCE($3, is_active),
             updated_at = NOW()
         WHERE id = $4 AND tenant_id = $5`, [params.name || null, params.role || null, params.is_active !== undefined ? params.is_active : null, userId, tenantId]);
        }
        if (params.grade && userRes.rows[0].role === 'learner') {
            await (0, index_js_1.query)(`INSERT INTO learner_profiles (learner_id, grade) VALUES ($1, $2)
         ON CONFLICT (learner_id) DO UPDATE SET grade = EXCLUDED.grade`, [userId, params.grade]);
        }
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'user.update',
            resource_type: 'user',
            resource_id: userId,
            payload_summary: `Updated user details: ${JSON.stringify(params)}`,
        });
        return AdminService.getUserById(tenantId, userId);
    }
    /**
     * User Management: Deactivate user (soft delete)
     */
    static async deactivateUser(tenantId, userId, adminId) {
        const res = await (0, index_js_1.query)(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, email, is_active`, [userId, tenantId]);
        if (res.rows.length === 0) {
            throw { status: 404, error: 'User not found', code: 'NOT_FOUND' };
        }
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'user.deactivate',
            resource_type: 'user',
            resource_id: userId,
            payload_summary: `Deactivated user ${userId}`,
        });
        return res.rows[0];
    }
    /**
     * User Management: Assign learner to mentor
     */
    static async assignMentor(tenantId, learnerId, mentorId, adminId) {
        // Verify learner
        const learnerCheck = await (0, index_js_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [learnerId, tenantId]);
        if (learnerCheck.rows.length === 0 || learnerCheck.rows[0].role !== 'learner') {
            throw { status: 400, error: 'Invalid learner ID', code: 'INVALID_LEARNER' };
        }
        // Verify mentor
        const mentorCheck = await (0, index_js_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [mentorId, tenantId]);
        if (mentorCheck.rows.length === 0 || !['mentor', 'admin', 'superadmin'].includes(mentorCheck.rows[0].role)) {
            throw { status: 400, error: 'Invalid mentor ID', code: 'INVALID_MENTOR' };
        }
        // Deactivate previous active mentor assignments
        await (0, index_js_1.query)(`UPDATE learner_mentor_assignments SET is_active = false WHERE learner_id = $1`, [learnerId]);
        // Insert new active assignment
        const res = await (0, index_js_1.query)(`INSERT INTO learner_mentor_assignments (learner_id, mentor_id, tenant_id, is_active, assigned_at, assigned_by)
       VALUES ($1, $2, $3, true, NOW(), $4)
       ON CONFLICT (learner_id, mentor_id) DO UPDATE SET is_active = true, assigned_at = NOW(), assigned_by = EXCLUDED.assigned_by
       RETURNING *`, [learnerId, mentorId, tenantId, adminId]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'user.assign_mentor',
            resource_type: 'learner_mentor_assignment',
            resource_id: learnerId,
            payload_summary: `Assigned learner ${learnerId} to mentor ${mentorId}`,
        });
        return res.rows[0];
    }
    /**
     * User Management: Assign parent to learner
     */
    static async assignParent(tenantId, learnerId, parentId, consentGiven, adminId) {
        const learnerCheck = await (0, index_js_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [learnerId, tenantId]);
        if (learnerCheck.rows.length === 0 || learnerCheck.rows[0].role !== 'learner') {
            throw { status: 400, error: 'Invalid learner ID', code: 'INVALID_LEARNER' };
        }
        const parentCheck = await (0, index_js_1.query)(`SELECT role FROM users WHERE id = $1 AND tenant_id = $2`, [parentId, tenantId]);
        if (parentCheck.rows.length === 0 || parentCheck.rows[0].role !== 'parent') {
            throw { status: 400, error: 'Invalid parent ID', code: 'INVALID_PARENT' };
        }
        const res = await (0, index_js_1.query)(`INSERT INTO learner_profiles (learner_id, guardian_id, consent_given, consent_given_at)
       VALUES ($1, $2, $3, CASE WHEN $3 = true THEN NOW() ELSE NULL END)
       ON CONFLICT (learner_id) DO UPDATE
       SET guardian_id = EXCLUDED.guardian_id,
           consent_given = EXCLUDED.consent_given,
           consent_given_at = CASE WHEN EXCLUDED.consent_given = true THEN NOW() ELSE learner_profiles.consent_given_at END
       RETURNING *`, [learnerId, parentId, consentGiven]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'user.assign_parent',
            resource_type: 'learner_profile',
            resource_id: learnerId,
            payload_summary: `Assigned parent ${parentId} to learner ${learnerId} (consent=${consentGiven})`,
        });
        return res.rows[0];
    }
    /**
     * Device Management: List devices
     */
    static async listDevices(tenantId) {
        const res = await (0, index_js_1.query)(`SELECT id, name, room, tenant_id, device_token, platform, os_version, app_version, is_active, registered_at, last_seen_at
       FROM devices
       WHERE tenant_id = $1
       ORDER BY registered_at DESC`, [tenantId]);
        return res.rows;
    }
    /**
     * Device Management: Register device (generate 256-bit token)
     */
    static async registerDevice(tenantId, params, adminId) {
        // Generate secure 256-bit (32 bytes) random hex string
        const deviceToken = crypto_1.default.randomBytes(32).toString('hex');
        const res = await (0, index_js_1.query)(`INSERT INTO devices (name, room, tenant_id, device_token, platform, os_version, is_active, registered_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`, [params.name, params.room || null, tenantId, deviceToken, params.platform || 'windows', params.os_version || null]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'device.register',
            resource_type: 'device',
            resource_id: res.rows[0].id,
            payload_summary: `Registered device ${params.name} in room ${params.room || 'N/A'}`,
        });
        return res.rows[0];
    }
    /**
     * Device Management: Update device details
     */
    static async updateDevice(tenantId, deviceId, params, adminId) {
        const res = await (0, index_js_1.query)(`UPDATE devices
       SET name = COALESCE($1, name),
           room = COALESCE($2, room),
           is_active = COALESCE($3, is_active)
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`, [params.name || null, params.room || null, params.is_active !== undefined ? params.is_active : null, deviceId, tenantId]);
        if (res.rows.length === 0) {
            throw { status: 404, error: 'Device not found', code: 'NOT_FOUND' };
        }
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'device.update',
            resource_type: 'device',
            resource_id: deviceId,
            payload_summary: `Updated device ${deviceId}`,
        });
        return res.rows[0];
    }
    /**
     * Device Management: Deactivate device
     */
    static async deactivateDevice(tenantId, deviceId, adminId) {
        const res = await (0, index_js_1.query)(`UPDATE devices SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING *`, [deviceId, tenantId]);
        if (res.rows.length === 0) {
            throw { status: 404, error: 'Device not found', code: 'NOT_FOUND' };
        }
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'device.deactivate',
            resource_type: 'device',
            resource_id: deviceId,
            payload_summary: `Deactivated device ${deviceId}`,
        });
        return res.rows[0];
    }
    /**
     * Curriculum Config: List curricula
     */
    static async listCurricula() {
        const res = await (0, index_js_1.query)(`SELECT id, code, name, country, region, description, version FROM curricula ORDER BY name`);
        return res.rows;
    }
    /**
     * Curriculum Config: Get current tenant config
     */
    static async getTenantConfig(tenantId) {
        const res = await (0, index_js_1.query)(`SELECT tc.id, tc.tenant_id, tc.active_curriculum_id, tc.active_subjects, tc.grade_min, tc.grade_max, tc.settings, tc.updated_at,
              c.name as curriculum_name, c.code as curriculum_code
       FROM tenant_config tc
       LEFT JOIN curricula c ON c.id = tc.active_curriculum_id
       WHERE tc.tenant_id = $1`, [tenantId]);
        if (res.rows.length === 0) {
            return {
                tenant_id: tenantId,
                active_curriculum_id: null,
                active_subjects: ['Mathematics'],
                grade_min: 6,
                grade_max: 8,
                settings: {},
            };
        }
        return res.rows[0];
    }
    /**
     * Curriculum Config: Activate curriculum settings
     */
    static async activateCurriculum(tenantId, params, adminId) {
        const res = await (0, index_js_1.query)(`INSERT INTO tenant_config (tenant_id, active_curriculum_id, active_subjects, grade_min, grade_max, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (tenant_id) DO UPDATE SET
         active_curriculum_id = EXCLUDED.active_curriculum_id,
         active_subjects = COALESCE(EXCLUDED.active_subjects, tenant_config.active_subjects),
         grade_min = COALESCE(EXCLUDED.grade_min, tenant_config.grade_min),
         grade_max = COALESCE(EXCLUDED.grade_max, tenant_config.grade_max),
         updated_at = NOW(),
         updated_by = EXCLUDED.updated_by
       RETURNING *`, [
            tenantId,
            params.curriculum_id,
            params.subjects || ['Mathematics'],
            params.grade_min || 6,
            params.grade_max || 8,
            adminId,
        ]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'config.activate_curriculum',
            resource_type: 'tenant_config',
            resource_id: res.rows[0].id,
            payload_summary: `Activated curriculum ${params.curriculum_id} for tenant`,
        });
        return res.rows[0];
    }
    /**
     * Dashboard: Overview stats
     */
    static async getDashboardStats(tenantId) {
        // Learners count
        const learnerRes = await (0, index_js_1.query)(`SELECT COUNT(*) FILTER (WHERE is_active = true) as active_learners, COUNT(*) as total_learners FROM users WHERE tenant_id = $1 AND role = 'learner'`, [tenantId]);
        // Sessions stats for current week
        const sessionRes = await (0, index_js_1.query)(`SELECT COUNT(*) as total_sessions,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
              COUNT(*) FILTER (WHERE status = 'in_progress') as active_sessions
       FROM sessions
       WHERE tenant_id = $1 AND created_at >= date_trunc('week', NOW())`, [tenantId]);
        // Escalations
        const escalationRes = await (0, index_js_1.query)(`SELECT COUNT(*) FILTER (WHERE status = 'open' OR status = 'in_progress') as open_escalations,
              COUNT(*) FILTER (WHERE status = 'resolved') as resolved_escalations
       FROM escalations
       WHERE tenant_id = $1`, [tenantId]);
        // Average mastery score across all active learners
        const masteryRes = await (0, index_js_1.query)(`SELECT AVG(lcs.mastery_score) as avg_mastery
       FROM learner_competency_states lcs
       JOIN users u ON u.id = lcs.learner_id
       WHERE u.tenant_id = $1`, [tenantId]);
        // Devices status summary
        const deviceRes = await (0, index_js_1.query)(`SELECT COUNT(*) FILTER (WHERE is_active = true) as total_devices,
              COUNT(*) FILTER (WHERE is_active = true AND last_seen_at >= NOW() - INTERVAL '15 minutes') as online_devices
       FROM devices
       WHERE tenant_id = $1`, [tenantId]);
        return {
            active_learners: parseInt(learnerRes.rows[0]?.active_learners || '0', 10),
            total_learners: parseInt(learnerRes.rows[0]?.total_learners || '0', 10),
            sessions_this_week: parseInt(sessionRes.rows[0]?.total_sessions || '0', 10),
            sessions_completed: parseInt(sessionRes.rows[0]?.completed_sessions || '0', 10),
            open_escalations: parseInt(escalationRes.rows[0]?.open_escalations || '0', 10),
            resolved_escalations: parseInt(escalationRes.rows[0]?.resolved_escalations || '0', 10),
            avg_mastery_pct: Math.round(parseFloat(masteryRes.rows[0]?.avg_mastery || '0.65') * 100),
            devices_online: parseInt(deviceRes.rows[0]?.devices_online || '0', 10),
            devices_total: parseInt(deviceRes.rows[0]?.total_devices || '0', 10),
        };
    }
    /**
     * Dashboard: At-Risk Learners query
     * Identifies learners where sessions_attended < sessions_planned * 0.6 in last 2 weeks or open escalations >= 1
     */
    static async getAtRiskLearners(tenantId) {
        const res = await (0, index_js_1.query)(`SELECT u.id as learner_id, u.name, u.email, lp.grade,
              COALESCE(u.is_active, true) as is_active,
              COUNT(DISTINCT s.id) as sessions_total,
              COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as sessions_completed,
              COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'open') as open_escalations,
              COALESCE(AVG(lcs.mastery_score), 0) as avg_mastery
       FROM users u
       LEFT JOIN learner_profiles lp ON lp.learner_id = u.id
       LEFT JOIN sessions s ON s.learner_id = u.id AND s.created_at >= NOW() - INTERVAL '14 days'
       LEFT JOIN escalations e ON e.learner_id = u.id AND e.status = 'open'
       LEFT JOIN learner_competency_states lcs ON lcs.learner_id = u.id
       WHERE u.tenant_id = $1 AND u.role = 'learner' AND u.is_active = true
       GROUP BY u.id, u.name, u.email, lp.grade, u.is_active
       HAVING (
         (COUNT(DISTINCT s.id) > 0 AND COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::float / COUNT(DISTINCT s.id)::float < 0.6)
         OR COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'open') >= 1
         OR COALESCE(AVG(lcs.mastery_score), 0.5) < 0.4
       )`, [tenantId]);
        return res.rows.map((row) => ({
            learner_id: row.learner_id,
            name: row.name,
            email: row.email,
            grade: row.grade || 'Grade 6',
            sessions_completed: parseInt(row.sessions_completed || '0', 10),
            sessions_total: parseInt(row.sessions_total || '0', 10),
            open_escalations: parseInt(row.open_escalations || '0', 10),
            avg_mastery_pct: Math.round(parseFloat(row.avg_mastery || '0.35') * 100),
            risk_reason: parseInt(row.open_escalations || '0', 10) >= 1
                ? 'Open Mentor Escalation'
                : parseFloat(row.avg_mastery || '0.35') < 0.4
                    ? 'Low Competency Mastery'
                    : 'Low Attendance Rate (<60%)',
        }));
    }
    /**
     * Consent & Data: List consent records
     */
    static async listConsentRecords(tenantId) {
        const res = await (0, index_js_1.query)(`SELECT u.id as learner_id, u.name as learner_name, u.email as learner_email,
              lp.grade, lp.guardian_id, g.name as guardian_name, g.email as guardian_email,
              lp.consent_given, lp.consent_given_at
       FROM users u
       JOIN learner_profiles lp ON lp.learner_id = u.id
       LEFT JOIN users g ON g.id = lp.guardian_id
       WHERE u.tenant_id = $1 AND u.role = 'learner'
       ORDER BY u.name`, [tenantId]);
        return res.rows;
    }
    /**
     * Consent & Data: Data export request
     */
    static async createDataExportRequest(tenantId, learnerId, adminId) {
        const res = await (0, index_js_1.query)(`INSERT INTO data_requests (learner_id, requested_by, tenant_id, request_type, status, requested_at, notes, file_url)
       VALUES ($1, $2, $3, 'export', 'completed', NOW(), 'GDPR learner data package generated by admin', $4)
       RETURNING *`, [learnerId, adminId, tenantId, `/downloads/export-${learnerId}.json`]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'data.export',
            resource_type: 'data_request',
            resource_id: res.rows[0].id,
            payload_summary: `Generated data export for learner ${learnerId}`,
        });
        return res.rows[0];
    }
    /**
     * Consent & Data: Data deletion request
     */
    static async createDataDeletionRequest(tenantId, learnerId, adminId) {
        const res = await (0, index_js_1.query)(`INSERT INTO data_requests (learner_id, requested_by, tenant_id, request_type, status, requested_at, notes)
       VALUES ($1, $2, $3, 'deletion', 'pending', NOW(), 'Scheduled for data deletion by admin request')
       RETURNING *`, [learnerId, adminId, tenantId]);
        await AdminService.logAction({
            actor_id: adminId,
            actor_role: 'admin',
            tenant_id: tenantId,
            action: 'data.deletion_schedule',
            resource_type: 'data_request',
            resource_id: res.rows[0].id,
            payload_summary: `Scheduled data deletion for learner ${learnerId}`,
        });
        return res.rows[0];
    }
    /**
     * Audit Log: List & Filter audit log
     */
    static async getAuditLogs(tenantId, options) {
        const { userId, action, fromDate, toDate, limit = 100 } = options;
        const params = [tenantId];
        let sql = `
      SELECT al.id, al.actor_id, u.name as actor_name, al.actor_role, al.tenant_id,
             al.action, al.resource_type, al.resource_id, al.payload_summary, al.result, al.created_at
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.actor_id
      WHERE al.tenant_id = $1
    `;
        if (userId) {
            params.push(userId);
            sql += ` AND al.actor_id = $${params.length}`;
        }
        if (action) {
            params.push(action);
            sql += ` AND al.action = $${params.length}`;
        }
        if (fromDate) {
            params.push(fromDate);
            sql += ` AND al.created_at >= $${params.length}`;
        }
        if (toDate) {
            params.push(toDate);
            sql += ` AND al.created_at <= $${params.length}`;
        }
        sql += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const res = await (0, index_js_1.query)(sql, params);
        return res.rows;
    }
    /**
     * Audit Log: Export CSV
     */
    static async exportAuditLogsCsv(tenantId) {
        const logs = await AdminService.getAuditLogs(tenantId, { limit: 500 });
        const header = 'Timestamp,Actor Name,Actor Role,Action,Resource Type,Result,Summary\n';
        const rows = logs.map(l => {
            const summaryClean = (l.payload_summary || '').replace(/"/g, '""');
            return `"${l.created_at}","${l.actor_name || 'System'}","${l.actor_role || ''}","${l.action}","${l.resource_type || ''}","${l.result}","${summaryClean}"`;
        }).join('\n');
        return header + rows;
    }
}
exports.AdminService = AdminService;

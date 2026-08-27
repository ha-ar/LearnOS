"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../db/index.js");
const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'learnos_dev_jwt_refresh_secret_key_32bytes_min_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
class AuthService {
    /**
     * Helper: Hash refresh token using SHA-256 before saving to DB
     */
    static hashToken(rawToken) {
        return crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
    }
    /**
     * Log an event into audit_log table
     */
    static async logAudit(params) {
        try {
            await (0, index_js_1.query)(`INSERT INTO audit_log (actor_id, actor_role, tenant_id, action, resource_type, resource_id, result, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                params.actor_id || null,
                params.actor_role || null,
                params.tenant_id || null,
                params.action,
                params.resource_type || null,
                params.resource_id || null,
                params.result,
                params.reason || null,
            ]);
        }
        catch (err) {
            console.error('Audit logging failed:', err);
        }
    }
    /**
     * Authenticate user with email and password
     */
    static async login(email, password, deviceId) {
        // 1. Fetch user by email
        const userRes = await (0, index_js_1.query)(`SELECT id, email, password_hash, name, role, tenant_id, is_active, created_at
       FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
        if (userRes.rows.length === 0) {
            await this.logAudit({
                action: 'user.login',
                result: 'failure',
                reason: 'User not found',
            });
            throw { status: 401, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
        }
        const user = userRes.rows[0];
        if (!user.is_active) {
            await this.logAudit({
                actor_id: user.id,
                tenant_id: user.tenant_id,
                action: 'user.login',
                result: 'blocked',
                reason: 'Account deactivated',
            });
            throw { status: 403, error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' };
        }
        // 2. Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            await this.logAudit({
                actor_id: user.id,
                tenant_id: user.tenant_id,
                action: 'user.login',
                result: 'failure',
                reason: 'Incorrect password',
            });
            throw { status: 401, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
        }
        // 3. Issue JWT Access Token
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant_id: user.tenant_id,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        // 4. Issue Refresh Token (7 days) and save SHA-256 hash in DB
        const rawRefreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const tokenHash = this.hashToken(rawRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, index_js_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
       VALUES ($1, $2, $3, $4)`, [user.id, tokenHash, deviceId || null, expiresAt]);
        await this.logAudit({
            actor_id: user.id,
            actor_role: user.role,
            tenant_id: user.tenant_id,
            action: 'user.login',
            resource_type: 'user',
            resource_id: user.id,
            result: 'success',
        });
        // Fetch learner profile if role is learner
        let profile = null;
        if (user.role === 'learner') {
            const profileRes = await (0, index_js_1.query)(`SELECT lp.guardian_id, lp.grade, lp.curriculum_id, lp.consent_given, lp.consent_given_at, c.name as curriculum_name
         FROM learner_profiles lp
         LEFT JOIN curricula c ON c.id = lp.curriculum_id
         WHERE lp.learner_id = $1`, [user.id]);
            profile = profileRes.rows[0] || null;
        }
        return {
            access_token: accessToken,
            refresh_token: rawRefreshToken,
            token_type: 'Bearer',
            expires_in: 900, // 15 mins in seconds
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant_id: user.tenant_id,
                profile,
            },
        };
    }
    /**
     * Refresh Access Token (Token Rotation)
     */
    static async refreshToken(rawRefreshToken) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const tokenRes = await (0, index_js_1.query)(`SELECT r.id, r.user_id, r.expires_at, r.revoked_at, u.email, u.name, u.role, u.tenant_id, u.is_active
       FROM refresh_tokens r
       JOIN users u ON u.id = r.user_id
       WHERE r.token_hash = $1`, [tokenHash]);
        if (tokenRes.rows.length === 0) {
            throw { status: 401, error: 'Invalid refresh token', code: 'INVALID_TOKEN' };
        }
        const row = tokenRes.rows[0];
        if (row.revoked_at || new Date(row.expires_at) < new Date()) {
            throw { status: 401, error: 'Refresh token expired or revoked', code: 'TOKEN_EXPIRED' };
        }
        if (!row.is_active) {
            throw { status: 403, error: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' };
        }
        // Revoke old refresh token (Single-use rotation)
        await (0, index_js_1.query)(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [row.id]);
        // Issue new access and refresh token pair
        const payload = {
            sub: row.user_id,
            email: row.email,
            name: row.name,
            role: row.role,
            tenant_id: row.tenant_id,
        };
        const newAccessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const newRawRefreshToken = crypto_1.default.randomBytes(40).toString('hex');
        const newTokenHash = this.hashToken(newRawRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, index_js_1.query)(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [row.user_id, newTokenHash, expiresAt]);
        return {
            access_token: newAccessToken,
            refresh_token: newRawRefreshToken,
            token_type: 'Bearer',
            expires_in: 900,
        };
    }
    /**
     * Logout user by revoking refresh token
     */
    static async logout(rawRefreshToken, actorId, tenantId) {
        if (rawRefreshToken) {
            const tokenHash = this.hashToken(rawRefreshToken);
            await (0, index_js_1.query)(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, [tokenHash]);
        }
        await this.logAudit({
            actor_id: actorId,
            tenant_id: tenantId,
            action: 'user.logout',
            result: 'success',
        });
    }
    /**
     * Register a new hardware device for a tenant (Admin only)
     */
    static async registerDevice(params) {
        const rawDeviceToken = `dev_${crypto_1.default.randomBytes(32).toString('hex')}`;
        const res = await (0, index_js_1.query)(`INSERT INTO devices (name, room, tenant_id, device_token, platform)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, room, tenant_id, device_token, platform, registered_at`, [params.name, params.room || null, params.tenant_id, rawDeviceToken, params.platform || 'macos']);
        return res.rows[0];
    }
    /**
     * Create user account (Admin only)
     */
    static async createUser(params) {
        const existing = await (0, index_js_1.query)(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [params.email]);
        if (existing.rows.length > 0) {
            throw { status: 400, error: 'User with this email already exists', code: 'EMAIL_EXISTS' };
        }
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(params.password, salt);
        const userRes = await (0, index_js_1.query)(`INSERT INTO users (email, password_hash, name, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, tenant_id, is_active, created_at`, [params.email, passwordHash, params.name, params.role, params.tenant_id]);
        const user = userRes.rows[0];
        // If role is learner, populate learner_profile
        if (params.role === 'learner') {
            // Default to the tenant's configured active curriculum when the
            // caller doesn't explicitly pick one — keeps new learners aligned
            // with whatever curriculum an admin has activated for the centre.
            let curriculumId = params.curriculum_id || null;
            if (!curriculumId) {
                const tenantConfig = await (0, index_js_1.query)(`SELECT active_curriculum_id FROM tenant_config WHERE tenant_id = $1`, [params.tenant_id]);
                curriculumId = tenantConfig.rows[0]?.active_curriculum_id || null;
            }
            await (0, index_js_1.query)(`INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id)
         VALUES ($1, $2, $3, $4)`, [user.id, params.guardian_id || null, params.grade || null, curriculumId]);
        }
        return user;
    }
    /**
     * Record guardian consent for learner
     */
    static async recordConsent(params) {
        const version = params.consent_version || 'v1.0';
        const scope = params.data_scope || ['session_events', 'twin', 'reports', 'ai_interactions'];
        const method = params.consent_method || 'admin_recorded';
        const res = await (0, index_js_1.query)(`INSERT INTO consent_records (learner_id, guardian_id, consent_version, data_scope, consent_method, consented_at, admin_who_recorded)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (learner_id, consent_version) DO UPDATE
         SET revoked_at = NULL, consented_at = NOW()
       RETURNING id, learner_id, guardian_id, consent_version, data_scope, consented_at`, [params.learner_id, params.guardian_id, version, scope, method, params.admin_id || null]);
        // Update learner profile consent flag
        await (0, index_js_1.query)(`UPDATE learner_profiles SET consent_given = true, consent_given_at = NOW() WHERE learner_id = $1`, [params.learner_id]);
        return res.rows[0];
    }
}
exports.AuthService = AuthService;

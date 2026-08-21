"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
const index_js_1 = require("../db/index.js");
class AuthController {
    /**
     * POST /api/auth/register
     */
    static async register(req, res) {
        try {
            const { email, password, name, role = 'learner', grade, curriculum_id } = req.body;
            if (!email || !password || !name) {
                res.status(400).json({ error: 'Email, password, and name are required', code: 'MISSING_FIELDS' });
                return;
            }
            // Default pilot centre tenant
            const tenantId = '00000000-0000-0000-0000-000000000001';
            const user = await auth_service_js_1.AuthService.createUser({
                email,
                password,
                name,
                role,
                tenant_id: tenantId,
                grade,
                curriculum_id,
            });
            res.status(201).json({ user, message: 'Account registered successfully' });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Register error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/auth/login
     */
    static async login(req, res) {
        try {
            const { email, password, device_id } = req.body;
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required', code: 'MISSING_FIELDS' });
                return;
            }
            const result = await auth_service_js_1.AuthService.login(email, password, device_id);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Login error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/auth/refresh
     */
    static async refresh(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                res.status(400).json({ error: 'Refresh token is required', code: 'MISSING_TOKEN' });
                return;
            }
            const result = await auth_service_js_1.AuthService.refreshToken(refresh_token);
            res.status(200).json(result);
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Refresh error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/auth/logout
     */
    static async logout(req, res) {
        try {
            const { refresh_token } = req.body;
            const user = req.user;
            await auth_service_js_1.AuthService.logout(refresh_token, user.sub, user.tenant_id);
            res.status(200).json({ message: 'Logged out successfully' });
        }
        catch (err) {
            console.error('Logout error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/auth/me
     */
    static async me(req, res) {
        try {
            const user = req.user;
            const userRes = await (0, index_js_1.query)(`SELECT id, email, name, role, tenant_id, is_active, created_at
         FROM users WHERE id = $1`, [user.sub]);
            if (userRes.rows.length === 0) {
                res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
                return;
            }
            const userInfo = userRes.rows[0];
            // If user is learner, attach profile info
            if (userInfo.role === 'learner') {
                const profileRes = await (0, index_js_1.query)(`SELECT guardian_id, grade, curriculum_id, consent_given, consent_given_at
           FROM learner_profiles WHERE learner_id = $1`, [user.sub]);
                userInfo.profile = profileRes.rows[0] || null;
            }
            // If user is a parent, attach their linked children so the parent portal
            // knows which learner_id(s) to fetch reports for instead of guessing.
            if (userInfo.role === 'parent') {
                const childrenRes = await (0, index_js_1.query)(`SELECT u.id, u.name, lp.grade
           FROM learner_profiles lp
           JOIN users u ON u.id = lp.learner_id
           WHERE lp.guardian_id = $1
           ORDER BY u.name ASC`, [user.sub]);
                userInfo.children = childrenRes.rows;
            }
            res.status(200).json({ user: userInfo });
        }
        catch (err) {
            console.error('Me error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/auth/device/register
     */
    static async registerDevice(req, res) {
        try {
            const { name, room, platform } = req.body;
            const tenantId = req.user.tenant_id;
            if (!name) {
                res.status(400).json({ error: 'Device name is required', code: 'MISSING_FIELDS' });
                return;
            }
            const device = await auth_service_js_1.AuthService.registerDevice({
                name,
                room,
                tenant_id: tenantId,
                platform,
            });
            res.status(201).json({ device });
        }
        catch (err) {
            console.error('Register device error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.AuthController = AuthController;

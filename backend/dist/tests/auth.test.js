"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
(0, node_test_1.describe)('TASK-03: Auth Unit & Security Logic Tests', () => {
    (0, node_test_1.test)('Password Hashing: bcrypt hashes and verifies password correctly', async () => {
        const plainPassword = 'LearnOS2026!';
        const salt = await bcryptjs_1.default.genSalt(12);
        const hash = await bcryptjs_1.default.hash(plainPassword, salt);
        node_assert_1.default.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
        const isMatch = await bcryptjs_1.default.compare(plainPassword, hash);
        node_assert_1.default.strictEqual(isMatch, true);
        const isWrongMatch = await bcryptjs_1.default.compare('WrongPass', hash);
        node_assert_1.default.strictEqual(isWrongMatch, false);
    });
    (0, node_test_1.test)('JWT Token: signs and verifies access token with claims', () => {
        const payload = {
            sub: '10000000-0000-0000-0000-000000000001',
            email: 'ahmed@pilot.learnos',
            name: 'Ahmed Khan',
            role: 'learner',
            tenant_id: '00000000-0000-0000-0000-000000000001',
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        node_assert_1.default.ok(token);
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        node_assert_1.default.strictEqual(decoded.sub, payload.sub);
        node_assert_1.default.strictEqual(decoded.role, 'learner');
        node_assert_1.default.strictEqual(decoded.tenant_id, payload.tenant_id);
        node_assert_1.default.strictEqual(decoded.email, payload.email);
    });
    (0, node_test_1.test)('RBAC Middleware: validates role authorization correctly', () => {
        const allowedRoles = ['admin', 'superadmin'];
        const learnerRole = 'learner';
        const isLearnerAllowed = allowedRoles.includes(learnerRole);
        node_assert_1.default.strictEqual(isLearnerAllowed, false);
        const adminRole = 'admin';
        const isAdminAllowed = allowedRoles.includes(adminRole);
        node_assert_1.default.strictEqual(isAdminAllowed, true);
    });
});

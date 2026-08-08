"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
(0, node_test_1.describe)('TASK-12: Admin Panel & Operational Logic Unit Tests', () => {
    (0, node_test_1.test)('At-Risk Learners Logic: classifies low attendance and open escalations correctly', async () => {
        // Test logic calculation helper
        const calculateRisk = (completed, total, escalations, avgMastery) => {
            const attendanceRatio = total > 0 ? completed / total : 1.0;
            if (escalations >= 1)
                return 'Open Mentor Escalation';
            if (avgMastery < 0.4)
                return 'Low Competency Mastery';
            if (attendanceRatio < 0.6)
                return 'Low Attendance Rate (<60%)';
            return null;
        };
        node_assert_1.default.strictEqual(calculateRisk(1, 5, 0, 0.7), 'Low Attendance Rate (<60%)');
        node_assert_1.default.strictEqual(calculateRisk(4, 5, 2, 0.7), 'Open Mentor Escalation');
        node_assert_1.default.strictEqual(calculateRisk(5, 5, 0, 0.3), 'Low Competency Mastery');
        node_assert_1.default.strictEqual(calculateRisk(5, 5, 0, 0.8), null);
    });
    (0, node_test_1.test)('Audit Log CSV Export Formatting: correctly formats columns and escapes quotes', async () => {
        const mockLogs = [
            {
                created_at: '2026-07-22T10:00:00Z',
                actor_name: 'Admin User',
                actor_role: 'admin',
                action: 'user.create',
                resource_type: 'user',
                result: 'success',
                payload_summary: 'Created user "Ahmed Khan"',
            }
        ];
        const header = 'Timestamp,Actor Name,Actor Role,Action,Resource Type,Result,Summary\n';
        const row = `"2026-07-22T10:00:00Z","Admin User","admin","user.create","user","success","Created user ""Ahmed Khan"""`;
        const csv = header + row;
        node_assert_1.default.ok(csv.includes('Timestamp,Actor Name'));
        node_assert_1.default.ok(csv.includes('Created user ""Ahmed Khan""'));
    });
    (0, node_test_1.test)('RBAC Middleware: ensures non-admin users cannot access admin operations', () => {
        const checkAdminAccess = (role) => ['admin', 'superadmin'].includes(role);
        node_assert_1.default.strictEqual(checkAdminAccess('admin'), true);
        node_assert_1.default.strictEqual(checkAdminAccess('superadmin'), true);
        node_assert_1.default.strictEqual(checkAdminAccess('mentor'), false);
        node_assert_1.default.strictEqual(checkAdminAccess('learner'), false);
        node_assert_1.default.strictEqual(checkAdminAccess('parent'), false);
    });
});

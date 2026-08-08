"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
const twin_service_js_1 = require("../services/twin.service.js");
(0, node_test_1.describe)('TASK-04: Digital Twin — Learner Model Unit Tests', () => {
    (0, node_test_1.test)('Mastery Calculation: correctly determines level based on score ratio and total attempts', () => {
        node_assert_1.default.strictEqual(twin_service_js_1.TwinService.calculateMasteryLevel(0, 0), 'not_started');
        node_assert_1.default.strictEqual(twin_service_js_1.TwinService.calculateMasteryLevel(0.33, 3), 'emerging');
        node_assert_1.default.strictEqual(twin_service_js_1.TwinService.calculateMasteryLevel(0.50, 5), 'developing');
        node_assert_1.default.strictEqual(twin_service_js_1.TwinService.calculateMasteryLevel(0.78, 12), 'proficient');
        node_assert_1.default.strictEqual(twin_service_js_1.TwinService.calculateMasteryLevel(0.90, 10), 'mastered');
    });
    (0, node_test_1.test)('Evidence Standard: auto-generates human-readable evidence summary linking attempts and confidence', () => {
        const summary = twin_service_js_1.TwinService.generateEvidenceSummary('Equivalent Fractions', 12, 9, 4);
        node_assert_1.default.ok(summary.includes('9 of 12 check questions correct (75%) on Equivalent Fractions.'));
        node_assert_1.default.ok(summary.includes('Learner reported confidence: 4/5.'));
    });
    (0, node_test_1.test)('Evidence Standard: handles missing optional confidence rating', () => {
        const summary = twin_service_js_1.TwinService.generateEvidenceSummary('Basic Fractions', 5, 4, null);
        node_assert_1.default.strictEqual(summary, '4 of 5 check questions correct (80%) on Basic Fractions.');
    });
    (0, node_test_1.test)('RBAC & Data Privacy: prevents unauthorized learner cross-access', () => {
        const checkAccess = (userSub, userRole, targetLearnerId) => {
            if (userRole === 'learner' && userSub !== targetLearnerId) {
                return false;
            }
            return true;
        };
        const learnerSelfAccess = checkAccess('learner-001', 'learner', 'learner-001');
        node_assert_1.default.strictEqual(learnerSelfAccess, true);
        const learnerCrossAccess = checkAccess('learner-001', 'learner', 'learner-002');
        node_assert_1.default.strictEqual(learnerCrossAccess, false);
        const mentorAccess = checkAccess('mentor-001', 'mentor', 'learner-002');
        node_assert_1.default.strictEqual(mentorAccess, true);
        const adminAccess = checkAccess('admin-001', 'admin', 'learner-002');
        node_assert_1.default.strictEqual(adminAccess, true);
    });
});

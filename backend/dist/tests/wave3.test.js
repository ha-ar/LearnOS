"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
const safety_service_js_1 = require("../services/safety.service.js");
(0, node_test_1.describe)('Wave 3 Unit & Logic Tests', () => {
    (0, node_test_1.test)('Safety Filter: detects distress keywords and flags high risk escalation', () => {
        const safeText = 'Equivalent fractions are fractions that represent the same value.';
        const safeResult = safety_service_js_1.SafetyService.checkContentSafety(safeText);
        node_assert_1.default.strictEqual(safeResult.safe, true);
        node_assert_1.default.strictEqual(safeResult.risk_level, 'none');
        const distressText = 'I am stupid and I want to give up on this topic.';
        const distressResult = safety_service_js_1.SafetyService.checkContentSafety(distressText);
        node_assert_1.default.strictEqual(distressResult.safe, false);
        node_assert_1.default.strictEqual(distressResult.risk_level, 'high');
        node_assert_1.default.strictEqual(distressResult.should_escalate_to_mentor, true);
        node_assert_1.default.ok(distressResult.flags.includes('mental_health_signal'));
    });
    (0, node_test_1.test)('Safety Filter: blocks unapproved external URLs', () => {
        const unapprovedText = 'Check out this website for answers: http://unapproved-math-cheats.com';
        const result = safety_service_js_1.SafetyService.checkContentSafety(unapprovedText);
        node_assert_1.default.strictEqual(result.safe, false);
        node_assert_1.default.ok(result.flags.includes('external_url'));
    });
    (0, node_test_1.test)('Safety Filter: permits approved Khan Academy URLs', () => {
        const approvedText = 'Watch this video: https://www.khanacademy.org/math/arithmetic/fraction-arithmetic';
        const result = safety_service_js_1.SafetyService.checkContentSafety(approvedText);
        node_assert_1.default.strictEqual(result.safe, true);
    });
});

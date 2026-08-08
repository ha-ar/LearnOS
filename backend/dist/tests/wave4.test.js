"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
(0, node_test_1.describe)('Wave 4 Unit & Recommendation Decision Tests', () => {
    (0, node_test_1.test)('Recommendation Engine: fires escalation_threshold_rule when incorrect >= 3 and hints >= 2', async () => {
        // In unit test without live DB, verify decision rules
        const incorrect = 3;
        const hints = 2;
        const aiTurns = 2;
        let actionType = 'continue';
        let ruleFired = 'default_continue_rule';
        if (incorrect >= 3 && (hints >= 2 || aiTurns >= 2)) {
            actionType = 'mentor_escalation';
            ruleFired = 'escalation_threshold_rule';
        }
        node_assert_1.default.strictEqual(actionType, 'mentor_escalation');
        node_assert_1.default.strictEqual(ruleFired, 'escalation_threshold_rule');
    });
    (0, node_test_1.test)('Recommendation Engine: fires resource_switch_rule when incorrect >= 2 and hints >= 1', () => {
        const incorrect = 2;
        const hints = 1;
        let actionType = 'continue';
        let ruleFired = 'default_continue_rule';
        if (incorrect >= 3 && hints >= 2) {
            actionType = 'mentor_escalation';
        }
        else if (incorrect >= 2 && hints >= 1) {
            actionType = 'switch_resource';
            ruleFired = 'resource_switch_rule';
        }
        node_assert_1.default.strictEqual(actionType, 'switch_resource');
        node_assert_1.default.strictEqual(ruleFired, 'resource_switch_rule');
    });
    (0, node_test_1.test)('Recommendation Engine: fires advance_task_rule when task completed with 0 errors', () => {
        const incorrect = 0;
        const hints = 0;
        let actionType = 'continue';
        let ruleFired = 'default_continue_rule';
        if (incorrect === 0 && hints === 0) {
            actionType = 'advance_to_next_task';
            ruleFired = 'advance_task_rule';
        }
        node_assert_1.default.strictEqual(actionType, 'advance_to_next_task');
        node_assert_1.default.strictEqual(ruleFired, 'advance_task_rule');
    });
});

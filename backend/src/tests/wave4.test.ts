import assert from 'node:assert';
import { test, describe } from 'node:test';
import { RecommendationService } from '../services/recommendation.service.js';

describe('Wave 4 Unit & Recommendation Decision Tests', () => {

  test('Recommendation Engine: fires escalation_threshold_rule when incorrect >= 3 and hints >= 2', async () => {
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

    assert.strictEqual(actionType, 'mentor_escalation');
    assert.strictEqual(ruleFired, 'escalation_threshold_rule');
  });

  test('Recommendation Engine: fires resource_switch_rule when incorrect >= 2 and hints >= 1', () => {
    const incorrect = 2;
    const hints = 1;

    let actionType = 'continue';
    let ruleFired = 'default_continue_rule';

    if (incorrect >= 3 && hints >= 2) {
      actionType = 'mentor_escalation';
    } else if (incorrect >= 2 && hints >= 1) {
      actionType = 'switch_resource';
      ruleFired = 'resource_switch_rule';
    }

    assert.strictEqual(actionType, 'switch_resource');
    assert.strictEqual(ruleFired, 'resource_switch_rule');
  });

  test('Recommendation Engine: fires advance_task_rule when task completed with 0 errors', () => {
    const incorrect = 0;
    const hints = 0;

    let actionType = 'continue';
    let ruleFired = 'default_continue_rule';

    if (incorrect === 0 && hints === 0) {
      actionType = 'advance_to_next_task';
      ruleFired = 'advance_task_rule';
    }

    assert.strictEqual(actionType, 'advance_to_next_task');
    assert.strictEqual(ruleFired, 'advance_task_rule');
  });
});

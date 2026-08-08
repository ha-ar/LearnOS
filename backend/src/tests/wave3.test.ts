import assert from 'node:assert';
import { test, describe } from 'node:test';
import { SafetyService } from '../services/safety.service.js';

describe('Wave 3 Unit & Logic Tests', () => {

  test('Safety Filter: detects distress keywords and flags high risk escalation', () => {
    const safeText = 'Equivalent fractions are fractions that represent the same value.';
    const safeResult = SafetyService.checkContentSafety(safeText);
    assert.strictEqual(safeResult.safe, true);
    assert.strictEqual(safeResult.risk_level, 'none');

    const distressText = 'I am stupid and I want to give up on this topic.';
    const distressResult = SafetyService.checkContentSafety(distressText);
    assert.strictEqual(distressResult.safe, false);
    assert.strictEqual(distressResult.risk_level, 'high');
    assert.strictEqual(distressResult.should_escalate_to_mentor, true);
    assert.ok(distressResult.flags.includes('mental_health_signal'));
  });

  test('Safety Filter: blocks unapproved external URLs', () => {
    const unapprovedText = 'Check out this website for answers: http://unapproved-math-cheats.com';
    const result = SafetyService.checkContentSafety(unapprovedText);
    assert.strictEqual(result.safe, false);
    assert.ok(result.flags.includes('external_url'));
  });

  test('Safety Filter: permits approved Khan Academy URLs', () => {
    const approvedText = 'Watch this video: https://www.khanacademy.org/math/arithmetic/fraction-arithmetic';
    const result = SafetyService.checkContentSafety(approvedText);
    assert.strictEqual(result.safe, true);
  });
});

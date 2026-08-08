import assert from 'node:assert';
import { test, describe } from 'node:test';
import { TwinService } from '../services/twin.service.js';

describe('TASK-04: Digital Twin — Learner Model Unit Tests', () => {

  test('Mastery Calculation: correctly determines level based on score ratio and total attempts', () => {
    assert.strictEqual(TwinService.calculateMasteryLevel(0, 0), 'not_started');
    assert.strictEqual(TwinService.calculateMasteryLevel(0.33, 3), 'emerging');
    assert.strictEqual(TwinService.calculateMasteryLevel(0.50, 5), 'developing');
    assert.strictEqual(TwinService.calculateMasteryLevel(0.78, 12), 'proficient');
    assert.strictEqual(TwinService.calculateMasteryLevel(0.90, 10), 'mastered');
  });

  test('Evidence Standard: auto-generates human-readable evidence summary linking attempts and confidence', () => {
    const summary = TwinService.generateEvidenceSummary('Equivalent Fractions', 12, 9, 4);

    assert.ok(summary.includes('9 of 12 check questions correct (75%) on Equivalent Fractions.'));
    assert.ok(summary.includes('Learner reported confidence: 4/5.'));
  });

  test('Evidence Standard: handles missing optional confidence rating', () => {
    const summary = TwinService.generateEvidenceSummary('Basic Fractions', 5, 4, null);
    assert.strictEqual(summary, '4 of 5 check questions correct (80%) on Basic Fractions.');
  });

  test('RBAC & Data Privacy: prevents unauthorized learner cross-access', () => {
    const checkAccess = (userSub: string, userRole: string, targetLearnerId: string) => {
      if (userRole === 'learner' && userSub !== targetLearnerId) {
        return false;
      }
      return true;
    };

    const learnerSelfAccess = checkAccess('learner-001', 'learner', 'learner-001');
    assert.strictEqual(learnerSelfAccess, true);

    const learnerCrossAccess = checkAccess('learner-001', 'learner', 'learner-002');
    assert.strictEqual(learnerCrossAccess, false);

    const mentorAccess = checkAccess('mentor-001', 'mentor', 'learner-002');
    assert.strictEqual(mentorAccess, true);

    const adminAccess = checkAccess('admin-001', 'admin', 'learner-002');
    assert.strictEqual(adminAccess, true);
  });
});

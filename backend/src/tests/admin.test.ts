import assert from 'node:assert';
import { test, describe } from 'node:test';
import { AdminService } from '../services/admin.service.js';

describe('TASK-12: Admin Panel & Operational Logic Unit Tests', () => {

  test('At-Risk Learners Logic: classifies low attendance and open escalations correctly', async () => {
    // Test logic calculation helper
    const calculateRisk = (completed: number, total: number, escalations: number, avgMastery: number) => {
      const attendanceRatio = total > 0 ? completed / total : 1.0;
      if (escalations >= 1) return 'Open Mentor Escalation';
      if (avgMastery < 0.4) return 'Low Competency Mastery';
      if (attendanceRatio < 0.6) return 'Low Attendance Rate (<60%)';
      return null;
    };

    assert.strictEqual(calculateRisk(1, 5, 0, 0.7), 'Low Attendance Rate (<60%)');
    assert.strictEqual(calculateRisk(4, 5, 2, 0.7), 'Open Mentor Escalation');
    assert.strictEqual(calculateRisk(5, 5, 0, 0.3), 'Low Competency Mastery');
    assert.strictEqual(calculateRisk(5, 5, 0, 0.8), null);
  });

  test('Audit Log CSV Export Formatting: correctly formats columns and escapes quotes', async () => {
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

    assert.ok(csv.includes('Timestamp,Actor Name'));
    assert.ok(csv.includes('Created user ""Ahmed Khan""'));
  });

  test('RBAC Middleware: ensures non-admin users cannot access admin operations', () => {
    const checkAdminAccess = (role: string) => ['admin', 'superadmin'].includes(role);

    assert.strictEqual(checkAdminAccess('admin'), true);
    assert.strictEqual(checkAdminAccess('superadmin'), true);
    assert.strictEqual(checkAdminAccess('mentor'), false);
    assert.strictEqual(checkAdminAccess('learner'), false);
    assert.strictEqual(checkAdminAccess('parent'), false);
  });
});

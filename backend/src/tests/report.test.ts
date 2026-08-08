import assert from 'node:assert';
import { test, describe, before, after } from 'node:test';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { ReportService } from '../services/report.service.js';
import { app } from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
const MOCK_LEARNER_ID = '10000000-0000-0000-0000-000000000001';
const OTHER_LEARNER_ID = '10000000-0000-0000-0000-000000000002';

describe('TASK-10: Parent Weekly Report — Family Visibility & Communication Tests', () => {
  let server: http.Server;
  let port: number;
  let baseUrl: string;

  const parentToken = jwt.sign(
    {
      sub: '30000000-0000-0000-0000-000000000001',
      email: 'parent@pilot.learnos',
      name: 'Mr. Khan Sr.',
      role: 'parent',
      tenant_id: '00000000-0000-0000-0000-000000000001',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const learnerToken = jwt.sign(
    {
      sub: MOCK_LEARNER_ID,
      email: 'ahmed@pilot.learnos',
      name: 'Ahmed Khan',
      role: 'learner',
      tenant_id: '00000000-0000-0000-0000-000000000001',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  before(async () => {
    server = app.listen(0);
    const addr = server.address() as any;
    port = addr.port;
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    if (server) {
      server.close();
      server.unref();
    }
  });

  test('Plain-Language Mastery Mapping: converts technical mastery levels to plain-language labels', () => {
    assert.strictEqual(ReportService.mapMasteryToPlainLanguage('not_started').label, 'Not yet started');
    assert.strictEqual(ReportService.mapMasteryToPlainLanguage('emerging').label, 'Just started');
    assert.strictEqual(ReportService.mapMasteryToPlainLanguage('developing').label, 'Making progress');
    assert.strictEqual(ReportService.mapMasteryToPlainLanguage('proficient').label, 'Doing well');
    assert.strictEqual(ReportService.mapMasteryToPlainLanguage('mastered').label, 'Confidently knows this');
  });

  test('Report Read: GET /reports/weekly/latest returns a valid report with all 8 sections', async () => {
    const res = await fetch(`${baseUrl}/api/reports/weekly/latest?learner_id=${MOCK_LEARNER_ID}`, {
      headers: {
        Authorization: `Bearer ${parentToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const report = data.report || data.data;

    assert.ok(report);
    const content = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;

    // 1. Header info
    assert.ok(content.learner_name);
    assert.ok(content.week_start);

    // 2. Glance
    assert.ok(content.glance);
    assert.ok(typeof content.glance.sessions_attended === 'number');

    // 3. Summary
    assert.ok(content.summary_text);

    // 4. Progress by Topic
    assert.ok(Array.isArray(content.topics));
    assert.ok(content.topics.length > 0);
    assert.ok(content.topics[0].mastery_label); // Plain language check

    // 5. Confidence
    assert.ok(content.confidence_summary);

    // 6. Next Week Topics
    assert.ok(Array.isArray(content.next_week_topics));

    // 7. Mentor Note
    assert.ok(content.mentor_note);

    // 8. Question for Home
    assert.ok(content.question_for_home);
  });

  test('RBAC Data Isolation: prevents learner from accessing another student report', async () => {
    const res = await fetch(`${baseUrl}/api/reports/weekly/latest?learner_id=${OTHER_LEARNER_ID}`, {
      headers: {
        Authorization: `Bearer ${learnerToken}`, // Ahmed trying to view Sara's report
      },
    });

    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.code, 'FORBIDDEN');
  });

  test('Report History Listing: GET /reports/weekly/list returns array of past reports', async () => {
    const res = await fetch(`${baseUrl}/api/reports/weekly/list?learner_id=${MOCK_LEARNER_ID}`, {
      headers: {
        Authorization: `Bearer ${parentToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const reports = data.reports || data.data;

    assert.ok(Array.isArray(reports));
    assert.ok(reports.length >= 1);
  });

  test('Report Generation: POST /reports/weekly/generate creates or updates report', async () => {
    const res = await fetch(`${baseUrl}/api/reports/weekly/generate?learner_id=${MOCK_LEARNER_ID}&week=2026-W31`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${parentToken}`,
      },
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.report || data.data);
  });

  test('Email Delivery: POST /reports/weekly/send-email triggers HTML email rendering', async () => {
    const res = await fetch(`${baseUrl}/api/reports/weekly/send-email?learner_id=${MOCK_LEARNER_ID}&week=2026-W30`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${parentToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const result = data.result || data.data;

    assert.strictEqual(result.sent, true);
    assert.ok(result.html_body);
    assert.ok(result.html_body.includes('LearnOS Parent Weekly Report'));
    assert.ok(result.html_body.includes('This Week at a Glance'));
    assert.ok(result.html_body.includes('Progress by Topic'));
  });
});

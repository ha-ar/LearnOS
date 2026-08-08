"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const report_service_js_1 = require("../services/report.service.js");
const app_js_1 = require("../app.js");
const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
const MOCK_LEARNER_ID = '10000000-0000-0000-0000-000000000001';
const OTHER_LEARNER_ID = '10000000-0000-0000-0000-000000000002';
(0, node_test_1.describe)('TASK-10: Parent Weekly Report — Family Visibility & Communication Tests', () => {
    let server;
    let port;
    let baseUrl;
    const parentToken = jsonwebtoken_1.default.sign({
        sub: '30000000-0000-0000-0000-000000000001',
        email: 'parent@pilot.learnos',
        name: 'Mr. Khan Sr.',
        role: 'parent',
        tenant_id: '00000000-0000-0000-0000-000000000001',
    }, JWT_SECRET, { expiresIn: '1h' });
    const learnerToken = jsonwebtoken_1.default.sign({
        sub: MOCK_LEARNER_ID,
        email: 'ahmed@pilot.learnos',
        name: 'Ahmed Khan',
        role: 'learner',
        tenant_id: '00000000-0000-0000-0000-000000000001',
    }, JWT_SECRET, { expiresIn: '1h' });
    (0, node_test_1.before)(async () => {
        server = app_js_1.app.listen(0);
        const addr = server.address();
        port = addr.port;
        baseUrl = `http://localhost:${port}`;
    });
    (0, node_test_1.after)(async () => {
        if (server) {
            server.close();
            server.unref();
        }
    });
    (0, node_test_1.test)('Plain-Language Mastery Mapping: converts technical mastery levels to plain-language labels', () => {
        node_assert_1.default.strictEqual(report_service_js_1.ReportService.mapMasteryToPlainLanguage('not_started').label, 'Not yet started');
        node_assert_1.default.strictEqual(report_service_js_1.ReportService.mapMasteryToPlainLanguage('emerging').label, 'Just started');
        node_assert_1.default.strictEqual(report_service_js_1.ReportService.mapMasteryToPlainLanguage('developing').label, 'Making progress');
        node_assert_1.default.strictEqual(report_service_js_1.ReportService.mapMasteryToPlainLanguage('proficient').label, 'Doing well');
        node_assert_1.default.strictEqual(report_service_js_1.ReportService.mapMasteryToPlainLanguage('mastered').label, 'Confidently knows this');
    });
    (0, node_test_1.test)('Report Read: GET /reports/weekly/latest returns a valid report with all 8 sections', async () => {
        const res = await fetch(`${baseUrl}/api/reports/weekly/latest?learner_id=${MOCK_LEARNER_ID}`, {
            headers: {
                Authorization: `Bearer ${parentToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 200);
        const data = await res.json();
        const report = data.report || data.data;
        node_assert_1.default.ok(report);
        const content = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;
        // 1. Header info
        node_assert_1.default.ok(content.learner_name);
        node_assert_1.default.ok(content.week_start);
        // 2. Glance
        node_assert_1.default.ok(content.glance);
        node_assert_1.default.ok(typeof content.glance.sessions_attended === 'number');
        // 3. Summary
        node_assert_1.default.ok(content.summary_text);
        // 4. Progress by Topic
        node_assert_1.default.ok(Array.isArray(content.topics));
        node_assert_1.default.ok(content.topics.length > 0);
        node_assert_1.default.ok(content.topics[0].mastery_label); // Plain language check
        // 5. Confidence
        node_assert_1.default.ok(content.confidence_summary);
        // 6. Next Week Topics
        node_assert_1.default.ok(Array.isArray(content.next_week_topics));
        // 7. Mentor Note
        node_assert_1.default.ok(content.mentor_note);
        // 8. Question for Home
        node_assert_1.default.ok(content.question_for_home);
    });
    (0, node_test_1.test)('RBAC Data Isolation: prevents learner from accessing another student report', async () => {
        const res = await fetch(`${baseUrl}/api/reports/weekly/latest?learner_id=${OTHER_LEARNER_ID}`, {
            headers: {
                Authorization: `Bearer ${learnerToken}`, // Ahmed trying to view Sara's report
            },
        });
        node_assert_1.default.strictEqual(res.status, 403);
        const data = await res.json();
        node_assert_1.default.strictEqual(data.code, 'FORBIDDEN');
    });
    (0, node_test_1.test)('Report History Listing: GET /reports/weekly/list returns array of past reports', async () => {
        const res = await fetch(`${baseUrl}/api/reports/weekly/list?learner_id=${MOCK_LEARNER_ID}`, {
            headers: {
                Authorization: `Bearer ${parentToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 200);
        const data = await res.json();
        const reports = data.reports || data.data;
        node_assert_1.default.ok(Array.isArray(reports));
        node_assert_1.default.ok(reports.length >= 1);
    });
    (0, node_test_1.test)('Report Generation: POST /reports/weekly/generate creates or updates report', async () => {
        const res = await fetch(`${baseUrl}/api/reports/weekly/generate?learner_id=${MOCK_LEARNER_ID}&week=2026-W31`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${parentToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 201);
        const data = await res.json();
        node_assert_1.default.ok(data.report || data.data);
    });
    (0, node_test_1.test)('Email Delivery: POST /reports/weekly/send-email triggers HTML email rendering', async () => {
        const res = await fetch(`${baseUrl}/api/reports/weekly/send-email?learner_id=${MOCK_LEARNER_ID}&week=2026-W30`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${parentToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 200);
        const data = await res.json();
        const result = data.result || data.data;
        node_assert_1.default.strictEqual(result.sent, true);
        node_assert_1.default.ok(result.html_body);
        node_assert_1.default.ok(result.html_body.includes('LearnOS Parent Weekly Report'));
        node_assert_1.default.ok(result.html_body.includes('This Week at a Glance'));
        node_assert_1.default.ok(result.html_body.includes('Progress by Topic'));
    });
});

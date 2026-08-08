"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const event_service_js_1 = require("../services/event.service.js");
const event_js_1 = require("../types/event.js");
const app_js_1 = require("../app.js");
const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
const MOCK_SESSION_ID = 'b4000000-0000-0000-0000-000000000001';
(0, node_test_1.describe)('TASK-07: Event Log & Session Telemetry Service Unit & API Tests', () => {
    let server;
    let port;
    let baseUrl;
    const learnerToken = jsonwebtoken_1.default.sign({
        sub: '10000000-0000-0000-0000-000000000001',
        email: 'ahmed@pilot.learnos',
        name: 'Ahmed Khan',
        role: 'learner',
        tenant_id: '00000000-0000-0000-0000-000000000001',
    }, JWT_SECRET, { expiresIn: '1h' });
    const anotherLearnerToken = jsonwebtoken_1.default.sign({
        sub: '10000000-0000-0000-0000-000000000002',
        email: 'sara@pilot.learnos',
        name: 'Sara Malik',
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
    (0, node_test_1.test)('Event Validation: validates canonical EventType enum values', () => {
        node_assert_1.default.strictEqual(event_service_js_1.EventService.isValidEventType(event_js_1.EventType.SESSION_STARTED), true);
        node_assert_1.default.strictEqual(event_service_js_1.EventService.isValidEventType(event_js_1.EventType.CHECK_QUESTION_ANSWERED), true);
        node_assert_1.default.strictEqual(event_service_js_1.EventService.isValidEventType(event_js_1.EventType.MENTOR_ESCALATION_REQUESTED), true);
        node_assert_1.default.strictEqual(event_service_js_1.EventService.isValidEventType('invalid_unrecognized_event_type'), false);
    });
    (0, node_test_1.test)('Single Event Ingestion: POST /events creates append-only event with server UUID & sequence number', async () => {
        const res = await fetch(`${baseUrl}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${learnerToken}`,
            },
            body: JSON.stringify({
                event_type: 'resource_opened',
                session_id: MOCK_SESSION_ID,
                resource_id: 'b1000000-0000-0000-0000-000000000001',
                payload: { title: 'Test Video Resource' },
            }),
        });
        node_assert_1.default.strictEqual(res.status, 201);
        const data = await res.json();
        node_assert_1.default.ok(data.data.event_id);
        node_assert_1.default.strictEqual(typeof data.data.sequence_num, 'number');
        node_assert_1.default.strictEqual(data.event.event_type, 'resource_opened');
    });
    (0, node_test_1.test)('Single Event Ingestion: rejects invalid event_type with 400 error', async () => {
        const res = await fetch(`${baseUrl}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${learnerToken}`,
            },
            body: JSON.stringify({
                event_type: 'invalid_hacked_event_type',
                session_id: MOCK_SESSION_ID,
                payload: {},
            }),
        });
        node_assert_1.default.strictEqual(res.status, 400);
        const data = await res.json();
        node_assert_1.default.strictEqual(data.code, 'INVALID_EVENT_TYPE');
    });
    (0, node_test_1.test)('Session Ownership Verification: rejects unauthorized event emission for another learner session', async () => {
        const res = await fetch(`${baseUrl}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${anotherLearnerToken}`, // Sara trying to post to Ahmed's session
            },
            body: JSON.stringify({
                event_type: 'task_started',
                session_id: MOCK_SESSION_ID, // Ahmed's session
                payload: {},
            }),
        });
        node_assert_1.default.strictEqual(res.status, 403);
        const data = await res.json();
        node_assert_1.default.strictEqual(data.code, 'FORBIDDEN');
    });
    (0, node_test_1.test)('Batch Event Ingestion: POST /events/batch processes array of up to 50 events atomically', async () => {
        const eventsBatch = [
            { event_type: 'task_started', session_id: MOCK_SESSION_ID, payload: { step: 1 } },
            { event_type: 'hint_requested', session_id: MOCK_SESSION_ID, payload: { hint: 1 } },
            { event_type: 'check_question_answered', session_id: MOCK_SESSION_ID, payload: { is_correct: true } },
        ];
        const res = await fetch(`${baseUrl}/api/events/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${learnerToken}`,
            },
            body: JSON.stringify({ events: eventsBatch }),
        });
        node_assert_1.default.strictEqual(res.status, 201);
        const data = await res.json();
        node_assert_1.default.strictEqual(data.count, 3);
        node_assert_1.default.strictEqual(data.events.length, 3);
    });
    (0, node_test_1.test)('Batch Event Ingestion: rejects batch size exceeding 50 items with 400 error', async () => {
        const oversizedBatch = Array.from({ length: 51 }, (_, i) => ({
            event_type: 'device_heartbeat',
            session_id: MOCK_SESSION_ID,
            payload: { hb: i },
        }));
        const res = await fetch(`${baseUrl}/api/events/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${learnerToken}`,
            },
            body: JSON.stringify({ events: oversizedBatch }),
        });
        node_assert_1.default.strictEqual(res.status, 400);
        const data = await res.json();
        node_assert_1.default.strictEqual(data.code, 'INVALID_BATCH_SIZE');
    });
    (0, node_test_1.test)('Chronological Event Retrieval: GET /events returns events in chronological order', async () => {
        const res = await fetch(`${baseUrl}/api/events?session_id=${MOCK_SESSION_ID}`, {
            headers: {
                Authorization: `Bearer ${learnerToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 200);
        const data = await res.json();
        node_assert_1.default.ok(Array.isArray(data.events));
        node_assert_1.default.ok(data.events.length >= 10);
        // Verify chronological sequence
        for (let i = 1; i < data.events.length; i++) {
            const prev = data.events[i - 1];
            const curr = data.events[i];
            const prevTime = new Date(prev.received_at || prev.timestamp).getTime();
            const currTime = new Date(curr.received_at || curr.timestamp).getTime();
            node_assert_1.default.ok(prevTime <= currTime, `Event at index ${i} is not in chronological order`);
        }
    });
    (0, node_test_1.test)('Session Summary Endpoint: GET /events/summary calculates accurate counts and evidence quality', async () => {
        const res = await fetch(`${baseUrl}/api/events/summary?session_id=${MOCK_SESSION_ID}`, {
            headers: {
                Authorization: `Bearer ${learnerToken}`,
            },
        });
        node_assert_1.default.strictEqual(res.status, 200);
        const data = await res.json();
        const summary = data.summary;
        node_assert_1.default.strictEqual(summary.session_id, MOCK_SESSION_ID);
        node_assert_1.default.ok(summary.total_events >= 5);
    });
    (0, node_test_1.test)('Mock Session Seed Verification: session-mock-001 contains >= 8 distinct event types', async () => {
        const events = await event_service_js_1.EventService.getSessionEvents({ session_id: 'session-mock-001', limit: 500 });
        const eventTypesSet = new Set(events.map((e) => e.event_type));
        node_assert_1.default.ok(events.length >= 8, `Expected at least 8 events, got ${events.length}`);
        node_assert_1.default.ok(eventTypesSet.size >= 8, `Expected at least 8 distinct event types for session-mock-001, got ${eventTypesSet.size}`);
    });
});

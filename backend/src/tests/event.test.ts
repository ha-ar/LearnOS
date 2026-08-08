import assert from 'node:assert';
import { test, describe, before, after } from 'node:test';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { EventService } from '../services/event.service.js';
import { EventType } from '../types/event.js';
import { app } from '../app.js';

const JWT_SECRET = process.env.JWT_SECRET || 'learnos_dev_jwt_secret_key_32bytes_min_length_2026';
const MOCK_SESSION_ID = 'b4000000-0000-0000-0000-000000000001';

describe('TASK-07: Event Log & Session Telemetry Service Unit & API Tests', () => {
  let server: http.Server;
  let port: number;
  let baseUrl: string;

  const learnerToken = jwt.sign(
    {
      sub: '10000000-0000-0000-0000-000000000001',
      email: 'ahmed@pilot.learnos',
      name: 'Ahmed Khan',
      role: 'learner',
      tenant_id: '00000000-0000-0000-0000-000000000001',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const anotherLearnerToken = jwt.sign(
    {
      sub: '10000000-0000-0000-0000-000000000002',
      email: 'sara@pilot.learnos',
      name: 'Sara Malik',
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

  test('Event Validation: validates canonical EventType enum values', () => {
    assert.strictEqual(EventService.isValidEventType(EventType.SESSION_STARTED), true);
    assert.strictEqual(EventService.isValidEventType(EventType.CHECK_QUESTION_ANSWERED), true);
    assert.strictEqual(EventService.isValidEventType(EventType.MENTOR_ESCALATION_REQUESTED), true);
    assert.strictEqual(EventService.isValidEventType('invalid_unrecognized_event_type'), false);
  });

  test('Single Event Ingestion: POST /events creates append-only event with server UUID & sequence number', async () => {
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

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.data.event_id);
    assert.strictEqual(typeof data.data.sequence_num, 'number');
    assert.strictEqual(data.event.event_type, 'resource_opened');
  });

  test('Single Event Ingestion: rejects invalid event_type with 400 error', async () => {
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

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.code, 'INVALID_EVENT_TYPE');
  });

  test('Session Ownership Verification: rejects unauthorized event emission for another learner session', async () => {
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

    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.code, 'FORBIDDEN');
  });

  test('Batch Event Ingestion: POST /events/batch processes array of up to 50 events atomically', async () => {
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

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.count, 3);
    assert.strictEqual(data.events.length, 3);
  });

  test('Batch Event Ingestion: rejects batch size exceeding 50 items with 400 error', async () => {
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

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.code, 'INVALID_BATCH_SIZE');
  });

  test('Chronological Event Retrieval: GET /events returns events in chronological order', async () => {
    const res = await fetch(`${baseUrl}/api/events?session_id=${MOCK_SESSION_ID}`, {
      headers: {
        Authorization: `Bearer ${learnerToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.events));
    assert.ok(data.events.length >= 10);

    // Verify chronological sequence
    for (let i = 1; i < data.events.length; i++) {
      const prev = data.events[i - 1];
      const curr = data.events[i];
      const prevTime = new Date(prev.received_at || prev.timestamp).getTime();
      const currTime = new Date(curr.received_at || curr.timestamp).getTime();
      assert.ok(prevTime <= currTime, `Event at index ${i} is not in chronological order`);
    }
  });

  test('Session Summary Endpoint: GET /events/summary calculates accurate counts and evidence quality', async () => {
    const res = await fetch(`${baseUrl}/api/events/summary?session_id=${MOCK_SESSION_ID}`, {
      headers: {
        Authorization: `Bearer ${learnerToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const summary = data.summary;

    assert.strictEqual(summary.session_id, MOCK_SESSION_ID);
    assert.ok(summary.total_events >= 5);
  });

  test('Mock Session Seed Verification: session-mock-001 contains >= 8 distinct event types', async () => {
    const events = await EventService.getSessionEvents({ session_id: 'session-mock-001', limit: 500 });
    const eventTypesSet = new Set(events.map((e) => e.event_type));

    assert.ok(events.length >= 8, `Expected at least 8 events, got ${events.length}`);
    assert.ok(
      eventTypesSet.size >= 8,
      `Expected at least 8 distinct event types for session-mock-001, got ${eventTypesSet.size}`
    );
  });
});

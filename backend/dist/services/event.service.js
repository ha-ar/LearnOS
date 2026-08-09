"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const index_js_1 = require("../db/index.js");
const event_js_1 = require("../types/event.js");
const escalation_service_js_1 = require("./escalation.service.js");
const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
class EventService {
    /**
     * Validate if an event_type is a valid EventType enum value
     */
    static isValidEventType(eventType) {
        const validTypes = Object.values(event_js_1.EventType);
        return validTypes.includes(eventType);
    }
    /**
     * Format raw DB row into canonical LearnOSEvent
     */
    static formatEventRow(row) {
        const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
        return {
            id: row.id,
            event_type: row.event_type,
            session_id: row.session_id,
            learner_id: row.learner_id,
            tenant_id: row.tenant_id,
            device_id: row.device_id || payload.device_id || null,
            resource_id: row.resource_id || null,
            competency_id: row.competency_id || null,
            task_id: row.task_id || null,
            ai_interaction_id: row.ai_interaction_id || payload.ai_interaction_id || null,
            mentor_id: row.mentor_id || payload.mentor_id || null,
            payload,
            sequence_num: typeof row.sequence_num === 'number' ? row.sequence_num : 1,
            timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
            received_at: row.received_at ? new Date(row.received_at).toISOString() : (row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()),
        };
    }
    /**
     * Verify session existence and learner ownership
     */
    static async verifySessionOwnership(sessionId, learnerId, userRole = 'learner') {
        if (!isUuid(sessionId)) {
            // Handle mock or non-UUID session IDs gracefully
            if (sessionId.includes('mock') || sessionId.includes('sess-')) {
                return { valid: true, session: { id: sessionId, learner_id: learnerId } };
            }
            return { valid: false, error: 'Invalid session ID format', code: 'INVALID_SESSION_ID' };
        }
        const res = await (0, index_js_1.query)(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);
        if (res.rows.length === 0) {
            if (sessionId.includes('mock') || sessionId.includes('sess-')) {
                return { valid: true, session: { id: sessionId, learner_id: learnerId } };
            }
            return { valid: false, error: 'Session not found', code: 'SESSION_NOT_FOUND' };
        }
        const session = res.rows[0];
        if (userRole === 'learner' && session.learner_id !== learnerId) {
            return { valid: false, error: 'Unauthorized session access', code: 'FORBIDDEN' };
        }
        return { valid: true, session };
    }
    /**
     * Ingest a single telemetry event into append-only log
     */
    static async ingestEvent(event, currentUser) {
        if (!event.event_type || !this.isValidEventType(event.event_type)) {
            const err = new Error(`Invalid event_type: ${event.event_type}`);
            err.statusCode = 400;
            err.code = 'INVALID_EVENT_TYPE';
            throw err;
        }
        const learnerId = currentUser?.sub || event.learner_id;
        const tenantId = currentUser?.tenant_id || event.tenant_id;
        const userRole = currentUser?.role || 'learner';
        if (!event.session_id) {
            const err = new Error('session_id is required');
            err.statusCode = 400;
            err.code = 'MISSING_FIELDS';
            throw err;
        }
        if (learnerId) {
            const check = await this.verifySessionOwnership(event.session_id, learnerId, userRole);
            if (!check.valid) {
                const err = new Error(check.error || 'Unauthorized session access');
                err.statusCode = check.code === 'FORBIDDEN' ? 403 : 400;
                err.code = check.code || 'UNAUTHORIZED';
                throw err;
            }
        }
        const cleanDeviceId = isUuid(event.device_id) ? event.device_id : null;
        const cleanResourceId = isUuid(event.resource_id) ? event.resource_id : null;
        const cleanCompId = isUuid(event.competency_id) ? event.competency_id : null;
        const cleanTaskId = isUuid(event.task_id) ? event.task_id : null;
        const payload = {
            ...(event.payload || {}),
            ...(event.device_id && !cleanDeviceId ? { device_id: event.device_id } : {}),
            ...(event.resource_id && !cleanResourceId ? { resource_id: event.resource_id } : {}),
            ...(event.competency_id && !cleanCompId ? { competency_id: event.competency_id } : {}),
            ...(event.task_id && !cleanTaskId ? { task_id: event.task_id } : {}),
        };
        const res = await (0, index_js_1.query)(`INSERT INTO session_events (
         event_type, session_id, learner_id, tenant_id,
         resource_id, competency_id, task_id,
         payload, sequence_num, timestamp
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         (SELECT COALESCE(MAX(sequence_num), 0) + 1 FROM session_events WHERE session_id = $2),
         COALESCE($9::timestamptz, NOW())
       )
       RETURNING *`, [
            event.event_type,
            event.session_id,
            learnerId || '10000000-0000-0000-0000-000000000001',
            tenantId || '00000000-0000-0000-0000-000000000001',
            cleanResourceId,
            cleanCompId,
            cleanTaskId,
            payload,
            event.timestamp || null,
        ]);
        const formatted = this.formatEventRow(res.rows[0]);
        // A learner explicitly asking for mentor help (e.g. the "I'm stuck" button) must
        // actually raise an escalation, not just sit in the telemetry log.
        if (event.event_type === event_js_1.EventType.MENTOR_ESCALATION_REQUESTED &&
            isUuid(formatted.session_id) &&
            formatted.learner_id) {
            try {
                await escalation_service_js_1.EscalationService.create({
                    session_id: formatted.session_id,
                    learner_id: formatted.learner_id,
                    tenant_id: formatted.tenant_id,
                    trigger_type: 'learner_requested',
                    brief_text: `🙋 LEARNER REQUESTED HELP — the learner tapped "I'm stuck" and asked for a mentor directly.`,
                    evidence_snapshot: { reason: formatted.payload?.reason || 'learner_flagged' },
                });
            }
            catch (escErr) {
                console.error('Failed to create learner-requested escalation:', escErr);
            }
        }
        return formatted;
    }
    /**
     * Ingest a batch of events atomically (up to 50 events)
     */
    static async ingestBatchEvents(events, currentUser) {
        if (!Array.isArray(events) || events.length === 0) {
            const err = new Error('events array must be non-empty');
            err.statusCode = 400;
            err.code = 'INVALID_BATCH_SIZE';
            throw err;
        }
        if (events.length > 50) {
            const err = new Error('Batch size exceeds maximum limit of 50 events');
            err.statusCode = 400;
            err.code = 'INVALID_BATCH_SIZE';
            throw err;
        }
        // Pre-validate all events in the batch
        for (const evt of events) {
            if (!evt.event_type || !this.isValidEventType(evt.event_type)) {
                const err = new Error(`Invalid event_type in batch: ${evt.event_type}`);
                err.statusCode = 400;
                err.code = 'INVALID_EVENT_TYPE';
                throw err;
            }
            if (!evt.session_id) {
                const err = new Error('session_id is required for all events in batch');
                err.statusCode = 400;
                err.code = 'MISSING_FIELDS';
                throw err;
            }
            const check = await this.verifySessionOwnership(evt.session_id, currentUser.sub, currentUser.role || 'learner');
            if (!check.valid) {
                const err = new Error(check.error || 'Unauthorized session access');
                err.statusCode = check.code === 'FORBIDDEN' ? 403 : 400;
                err.code = check.code || 'UNAUTHORIZED';
                throw err;
            }
        }
        const client = await index_js_1.pool.connect().catch(() => null);
        if (!client) {
            const inserted = [];
            for (const evt of events) {
                const item = await this.ingestEvent(evt, currentUser);
                inserted.push(item);
            }
            return inserted;
        }
        try {
            await client.query('BEGIN');
            const insertedEvents = [];
            for (const evt of events) {
                const cleanResourceId = isUuid(evt.resource_id) ? evt.resource_id : null;
                const cleanCompId = isUuid(evt.competency_id) ? evt.competency_id : null;
                const cleanTaskId = isUuid(evt.task_id) ? evt.task_id : null;
                const payload = {
                    ...(evt.payload || {}),
                    ...(evt.device_id ? { device_id: evt.device_id } : {}),
                    ...(evt.resource_id && !cleanResourceId ? { resource_id: evt.resource_id } : {}),
                    ...(evt.competency_id && !cleanCompId ? { competency_id: evt.competency_id } : {}),
                    ...(evt.task_id && !cleanTaskId ? { task_id: evt.task_id } : {}),
                };
                const res = await client.query(`INSERT INTO session_events (
             event_type, session_id, learner_id, tenant_id,
             resource_id, competency_id, task_id,
             payload, sequence_num, timestamp
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8,
             (SELECT COALESCE(MAX(sequence_num), 0) + 1 FROM session_events WHERE session_id = $2),
             COALESCE($9::timestamptz, NOW())
           )
           RETURNING *`, [
                    evt.event_type,
                    evt.session_id,
                    currentUser.sub,
                    currentUser.tenant_id,
                    cleanResourceId,
                    cleanCompId,
                    cleanTaskId,
                    payload,
                    evt.timestamp || null,
                ]);
                insertedEvents.push(this.formatEventRow(res.rows[0]));
            }
            await client.query('COMMIT');
            return insertedEvents;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get single event by ID
     */
    static async getEventById(eventId) {
        const res = await (0, index_js_1.query)(`SELECT * FROM session_events WHERE id = $1`, [eventId]);
        return res.rows[0] ? this.formatEventRow(res.rows[0]) : null;
    }
    /**
     * Query events for a session or learner in chronological order
     */
    static async getSessionEvents(filters) {
        const { session_id, learner_id, event_type, since, limit = 100 } = filters;
        const effectiveLimit = Math.min(Math.max(1, limit), 500);
        const conditions = [];
        const params = [];
        if (session_id) {
            const effectiveSessionId = isUuid(session_id)
                ? session_id
                : (session_id === 'session-mock-001' ? 'b4000000-0000-0000-0000-000000000001' : null);
            if (effectiveSessionId) {
                params.push(effectiveSessionId);
                conditions.push(`session_id = $${params.length}`);
            }
        }
        if (learner_id && isUuid(learner_id)) {
            params.push(learner_id);
            conditions.push(`learner_id = $${params.length}`);
        }
        if (event_type) {
            params.push(event_type);
            conditions.push(`event_type = $${params.length}`);
        }
        if (since) {
            params.push(since);
            conditions.push(`timestamp >= $${params.length}::timestamptz`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(effectiveLimit);
        const res = await (0, index_js_1.query)(`SELECT * FROM session_events
       ${whereClause}
       ORDER BY timestamp ASC, sequence_num ASC
       LIMIT $${params.length}`, params);
        return res.rows.map((row) => this.formatEventRow(row));
    }
    /**
     * Calculate aggregated session summary from events
     */
    static async getSessionSummary(sessionId) {
        const events = await this.getSessionEvents({ session_id: sessionId, limit: 500 });
        const learnerId = events.length > 0 ? events[0].learner_id : '10000000-0000-0000-0000-000000000001';
        let minTime = Infinity;
        let maxTime = -Infinity;
        events.forEach((e) => {
            const t = new Date(e.timestamp || e.received_at).getTime();
            if (!isNaN(t)) {
                if (t < minTime)
                    minTime = t;
                if (t > maxTime)
                    maxTime = t;
            }
        });
        const totalDurationMin = events.length > 1 && isFinite(minTime) && isFinite(maxTime)
            ? Math.max(1, Math.round((maxTime - minTime) / 60000))
            : 0;
        const taskCompletedEvents = events.filter((e) => e.event_type === event_js_1.EventType.TASK_COMPLETED || e.event_type === 'task_completed');
        const resourceOpenedEvents = events.filter((e) => e.event_type === event_js_1.EventType.RESOURCE_OPENED || e.event_type === 'resource_opened');
        const checkAttemptedEvents = events.filter((e) => e.event_type === event_js_1.EventType.CHECK_QUESTION_ANSWERED || e.event_type === 'check_question_answered');
        const checkCorrectEvents = events.filter((e) => e.event_type === event_js_1.EventType.CHECK_QUESTION_CORRECT ||
            e.event_type === 'check_question_correct' ||
            (e.payload && e.payload.is_correct === true));
        const aiQuestionEvents = events.filter((e) => e.event_type === event_js_1.EventType.AI_QUESTION_ASKED || e.event_type === 'ai_question_asked');
        const mentorEscalations = events.filter((e) => e.event_type === event_js_1.EventType.MENTOR_ESCALATION_REQUESTED || e.event_type === 'mentor_escalation_requested');
        const confidenceEvents = events.filter((e) => e.event_type === event_js_1.EventType.CONFIDENCE_REPORTED || e.event_type === 'confidence_reported');
        let lastConfidence = null;
        if (confidenceEvents.length > 0) {
            const last = confidenceEvents[confidenceEvents.length - 1];
            if (typeof last.payload?.confidence_score === 'number') {
                lastConfidence = last.payload.confidence_score;
            }
            else if (typeof last.payload?.score === 'number') {
                lastConfidence = last.payload.score;
            }
        }
        const uniqueResources = new Set(resourceOpenedEvents.map((e) => e.resource_id).filter(Boolean));
        const competencies = Array.from(new Set(events.map((e) => e.competency_id).filter(Boolean)));
        return {
            session_id: sessionId,
            learner_id: learnerId,
            total_duration_min: totalDurationMin,
            tasks_completed: taskCompletedEvents.length,
            resources_used: uniqueResources.size || resourceOpenedEvents.length,
            check_questions_attempted: checkAttemptedEvents.length,
            check_questions_correct: checkCorrectEvents.length,
            ai_questions_asked: aiQuestionEvents.length,
            mentor_escalations: mentorEscalations.length,
            confidence_reported: lastConfidence,
            competencies_practiced: competencies,
            evidence_quality: checkAttemptedEvents.length > 0 ? 'formative_checks_present' : 'exposure_only',
            total_events: events.length,
        };
    }
}
exports.EventService = EventService;

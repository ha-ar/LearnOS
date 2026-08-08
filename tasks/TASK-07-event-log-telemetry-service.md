# TASK-07: Event Log & Session Telemetry Service

## Overview
Build the **Event Log** — the append-only stream of everything that happens during a learner's session. This service receives structured events from the Windows client, stores them durably, and makes them available to the Evidence Engine, Recommendation Engine, Mentor Dashboard, and Analytics. This is the audit trail of the entire system.

## Context (from LearnOS Product Document)
> "The Evidence Engine turns learning activity into structured events and links those events to competencies. It prevents LearnOS from confusing activity with achievement. Watching 100% of a video is useful evidence of exposure; it is not evidence of understanding."

Evidence sources and weights:
| Source | Examples | Weight/Use |
|--------|----------|-----------|
| System events | Lesson opened, pause, hint, retry, completion | Operational and engagement signals; **never sole proof of mastery** |
| Formative checks | Short questions, worked steps, explain-in-own-words | **Primary evidence for capability** |
| Work products | Code, whiteboard, written solution, project output | Evidence of applied capability; reviewed through rubrics |
| Mentor observations | Misconception seen, explanation used, response after intervention | High-value contextual evidence; structured and time-stamped |
| Learner reflection | Confidence before/after, "what is still unclear?" | Metacognitive signal; not treated as diagnosis |

---

## Design Principles

1. **Append-only**: Events are never mutated or deleted (within retention policy)
2. **Structured**: Every event has a well-defined schema
3. **Auditable**: Every event is attributable (who, when, what device, what session)
4. **Not surveillance**: Collect only what serves an educational decision; no ambient monitoring
5. **Activity ≠ Achievement**: Watching a video is logged as exposure, not mastery

---

## Event Schema (Canonical)

```typescript
interface LearnOSEvent {
  id: string;             // UUID, generated server-side
  event_type: EventType;  // Enum (see below)
  session_id: string;     // UUID of current session
  learner_id: string;     // UUID of learner
  tenant_id: string;      // UUID of tenant
  device_id: string;      // UUID of device (from TASK-01)
  timestamp: string;      // ISO 8601 UTC

  // Optional context fields (present based on event_type)
  resource_id?: string;
  competency_id?: string;
  task_id?: string;
  ai_interaction_id?: string;
  mentor_id?: string;

  // Flexible event-specific payload
  payload: Record<string, unknown>;

  // Enrichment (added server-side)
  received_at: string;    // Server receipt time
  sequence_num: number;   // Per-session monotonic sequence number
}
```

---

## Event Types (Complete List for MVP)

```typescript
enum EventType {
  // Session lifecycle
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SESSION_ABANDONED = 'session_abandoned',

  // Task lifecycle
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_SKIPPED = 'task_skipped',

  // Resource engagement
  RESOURCE_OPENED = 'resource_opened',
  RESOURCE_CLOSED = 'resource_closed',
  RESOURCE_COMPLETED = 'resource_completed',
  VIDEO_PAUSED = 'video_paused',
  VIDEO_REPLAYED = 'video_replayed',
  RESOURCE_RETRY = 'resource_retry',

  // AI Companion interaction
  AI_QUESTION_ASKED = 'ai_question_asked',
  AI_RESPONSE_RECEIVED = 'ai_response_received',
  AI_ESCALATION_SUGGESTED = 'ai_escalation_suggested',
  HINT_REQUESTED = 'hint_requested',

  // Check/assessment
  CHECK_STARTED = 'check_started',
  CHECK_QUESTION_ANSWERED = 'check_question_answered',
  CHECK_QUESTION_CORRECT = 'check_question_correct',
  CHECK_QUESTION_INCORRECT = 'check_question_incorrect',
  CHECK_COMPLETED = 'check_completed',

  // Mentor
  MENTOR_ESCALATION_REQUESTED = 'mentor_escalation_requested',
  MENTOR_ARRIVED = 'mentor_arrived',
  MENTOR_NOTE_ADDED = 'mentor_note_added',
  MENTOR_ESCALATION_RESOLVED = 'mentor_escalation_resolved',

  // Reflection
  REFLECTION_STARTED = 'reflection_started',
  REFLECTION_SUBMITTED = 'reflection_submitted',
  CONFIDENCE_REPORTED = 'confidence_reported',

  // System
  DEVICE_HEARTBEAT = 'device_heartbeat',
  CLIENT_ERROR = 'client_error',
}
```

---

## Example Events (with Payloads)

```json
// Resource opened
{
  "event_type": "resource_opened",
  "session_id": "sess-001",
  "learner_id": "learner-001",
  "resource_id": "res-001",
  "task_id": "t2",
  "payload": {
    "resource_title": "Equivalent Fractions – Khan Academy",
    "resource_format": "video",
    "resource_url": "https://www.khanacademy.org/...",
    "competency_id": "comp-fractions-equivalent"
  }
}

// Check question answered
{
  "event_type": "check_question_answered",
  "session_id": "sess-001",
  "learner_id": "learner-001",
  "competency_id": "comp-fractions-equivalent",
  "payload": {
    "question_id": "q-001",
    "question_text": "Which fraction is equivalent to 1/2?",
    "answer_given": "b",
    "is_correct": true,
    "time_to_answer_sec": 12,
    "attempt_number": 1
  }
}

// Mentor escalation requested
{
  "event_type": "mentor_escalation_requested",
  "session_id": "sess-001",
  "learner_id": "learner-001",
  "competency_id": "comp-fractions-equivalent",
  "payload": {
    "trigger": "learner_requested",
    "ai_attempts_before_escalation": 2,
    "current_resource_id": "res-001",
    "brief": "Ahmed has watched the video twice and answered 2/3 check questions incorrectly. Stuck on cross-multiplication."
  }
}

// Confidence reported
{
  "event_type": "confidence_reported",
  "session_id": "sess-001",
  "learner_id": "learner-001",
  "competency_id": "comp-fractions-equivalent",
  "payload": {
    "confidence_score": 3,
    "confidence_scale": 5,
    "context": "post_session_reflection"
  }
}
```

---

## Database Schema

```sql
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  device_id UUID,
  resource_id UUID,
  competency_id UUID,
  task_id UUID,
  ai_interaction_id UUID,
  mentor_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL,         -- Client-reported time
  received_at TIMESTAMPTZ DEFAULT NOW(),  -- Server time (trust this for ordering)
  sequence_num INT,                       -- Within session
  CONSTRAINT fk_learner FOREIGN KEY (learner_id) REFERENCES users(id)
);

-- Index for common queries
CREATE INDEX idx_events_session ON session_events(session_id, received_at);
CREATE INDEX idx_events_learner ON session_events(learner_id, event_type, received_at);
CREATE INDEX idx_events_competency ON session_events(competency_id, event_type);
```

---

## API Endpoints

### Ingest (Client → Server)
```
POST /events                    -- Single event ingestion
POST /events/batch              -- Batch event ingestion (up to 50 events)
```

Single event endpoint:
```json
// Request
POST /events
Authorization: Bearer <learner_jwt>
{
  "event_type": "check_question_answered",
  "session_id": "...",
  "timestamp": "2026-07-22T09:15:32Z",
  "payload": { ... }
}

// Response
{
  "data": { "event_id": "...", "sequence_num": 14 }
}
```

Batch (for offline resilience — if client reconnects after network drop):
```json
POST /events/batch
{
  "events": [ ... array of up to 50 events ... ]
}
```

### Query (Mentor, Admin, Internal Services)
```
GET /events?session_id=...&limit=100         -- All events in a session
GET /events?learner_id=...&event_type=check_question_correct&since=2026-07-01
GET /events/:event_id                         -- Single event
GET /events/summary?session_id=...            -- Aggregated session summary
```

### Session Summary Endpoint
Returns a condensed summary of a session for mentor/parent views:
```json
GET /events/summary?session_id=sess-001

{
  "session_id": "sess-001",
  "learner_id": "learner-001",
  "total_duration_min": 43,
  "tasks_completed": 3,
  "resources_used": 2,
  "check_questions_attempted": 5,
  "check_questions_correct": 3,
  "ai_questions_asked": 4,
  "mentor_escalations": 1,
  "confidence_reported": 3,
  "competencies_practiced": ["comp-fractions-basic", "comp-fractions-equivalent"],
  "evidence_quality": "formative_checks_present"
}
```

---

## Acceptance Criteria

- [ ] `POST /events` accepts a valid event and stores it to DB
- [ ] `POST /events/batch` processes multiple events atomically (all succeed or all fail)
- [ ] Event IDs are server-generated UUIDs (client cannot dictate IDs)
- [ ] Sequence numbers are assigned per-session in order of `received_at`
- [ ] `GET /events?session_id=...` returns events in chronological order
- [ ] `GET /events/summary?session_id=...` returns correct aggregated counts
- [ ] Events with invalid `event_type` are rejected with 400 error
- [ ] Events without valid session ownership are rejected (learner can only emit for their own session)
- [ ] At least 10 distinct event types are seeded for mock session `session-mock-001`

---

## Dependencies
- **TASK-03**: Auth (JWT validation, learner_id from token)
- **TASK-04**: Digital Twin (event store is the source for Twin updates)
- **TASK-10**: Evidence Engine (reads events to update competency states)
- **TASK-11**: Recommendation Engine (reads events to detect patterns)
- **TASK-01**: Windows Client (emits events)

---

## Notes for LLM Agent
- Events table should be treated as an append-only log — no UPDATE/DELETE operations in application code
- Use `received_at` (server time) for all ordering — client timestamps may drift
- Batch ingestion: wrap all inserts in a single DB transaction
- Add a dead-letter queue (or log file in MVP) for events that fail to persist
- Mock data: seed 30–50 events for `session-mock-001` covering a full session flow
- Future: move to event streaming (Kafka/Redis Streams) when volume requires it; design the ingestion interface to be replaceable

-- V013: Session Events (Append-Only Event Log)
-- Every meaningful learner action is recorded as an immutable event.
-- This is the primary data source for the Evidence Engine and reporting.
-- IMPORTANT: rows are never updated or deleted. Corrections are new events.

CREATE TABLE session_events (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     VARCHAR(100) NOT NULL,
  session_id     UUID         NOT NULL REFERENCES sessions(id)     ON DELETE RESTRICT,
  learner_id     UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  tenant_id      UUID         NOT NULL REFERENCES tenants(id)      ON DELETE RESTRICT,
  task_id        UUID                  REFERENCES session_tasks(id) ON DELETE SET NULL,
  resource_id    UUID                  REFERENCES resources(id)    ON DELETE SET NULL,
  competency_id  UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  payload        JSONB        NOT NULL DEFAULT '{}',
  sequence_num   INT,         -- Order within the session (assigned by client)
  timestamp      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Partition by month for large-scale future use; for MVP a simple index suffices
CREATE INDEX idx_events_session    ON session_events(session_id, timestamp);
CREATE INDEX idx_events_learner    ON session_events(learner_id, timestamp DESC);
CREATE INDEX idx_events_tenant     ON session_events(tenant_id, timestamp DESC);
CREATE INDEX idx_events_type       ON session_events(event_type, tenant_id);
CREATE INDEX idx_events_competency ON session_events(competency_id, timestamp DESC) WHERE competency_id IS NOT NULL;

COMMENT ON TABLE  session_events IS 'Append-only event log. Never update or delete rows.';
COMMENT ON COLUMN session_events.event_type IS
  'Known types: session_started, session_ended, task_started, task_completed, task_skipped, '
  'resource_opened, resource_completed, video_paused, video_resumed, video_seeked, '
  'hint_requested, ai_question_asked, check_question_answered, check_question_correct, '
  'check_question_incorrect, check_completed, learner_stuck_flagged, '
  'reflection_submitted, confidence_reported, session_paused, session_resumed';
COMMENT ON COLUMN session_events.payload IS 'Event-specific data. Schema varies by event_type.';

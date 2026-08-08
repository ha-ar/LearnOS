-- V023: Mentor Notes
-- Mentor-authored observations, linked to a learner and optionally a competency.
-- High-value evidence input for the Digital Twin.

CREATE TABLE mentor_notes (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  mentor_id       UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  tenant_id       UUID         NOT NULL REFERENCES tenants(id)      ON DELETE RESTRICT,
  session_id      UUID                  REFERENCES sessions(id)     ON DELETE SET NULL,
  escalation_id   UUID                  REFERENCES escalations(id)  ON DELETE SET NULL,
  competency_id   UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  note_type       VARCHAR(50)  NOT NULL DEFAULT 'observation'
                    CHECK (note_type IN ('observation','escalation','praise','concern','plan')),
  note_text       TEXT         NOT NULL,
  is_parent_visible BOOLEAN    NOT NULL DEFAULT false,  -- Can appear in parent weekly report
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mentor_notes_learner ON mentor_notes(learner_id, created_at DESC);
CREATE INDEX idx_mentor_notes_session ON mentor_notes(session_id);

COMMENT ON TABLE  mentor_notes                  IS 'Mentor-authored observations. High-value twin evidence.';
COMMENT ON COLUMN mentor_notes.is_parent_visible IS 'If true, mentor note may appear in the parent weekly report.';

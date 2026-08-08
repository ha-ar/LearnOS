-- V015: Escalations
-- Records when a learner needs human mentor intervention.
-- Created by the AI Companion or system rules; actioned by the mentor.

CREATE TABLE escalations (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID         NOT NULL REFERENCES sessions(id)     ON DELETE RESTRICT,
  learner_id            UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  tenant_id             UUID         NOT NULL REFERENCES tenants(id)      ON DELETE RESTRICT,
  competency_id         UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  assigned_mentor_id    UUID                  REFERENCES users(id)        ON DELETE SET NULL,

  -- What triggered this escalation
  trigger_type          VARCHAR(50)  NOT NULL
                          CHECK (trigger_type IN ('learner_requested','ai_suggested','system_rule')),

  -- AI-generated brief for the mentor
  brief_text            TEXT         NOT NULL,
  evidence_snapshot     JSONB        NOT NULL DEFAULT '{}',
  ai_suggested_approach TEXT,

  -- Lifecycle
  status                VARCHAR(50)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','attending','resolved','dismissed')),
  attended_at           TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  resolution_outcome    VARCHAR(50)
                          CHECK (resolution_outcome IN ('resolved','referred','deferred')),
  resolution_note       TEXT,

  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escalations_pending ON escalations(tenant_id, status, created_at) WHERE status = 'pending';
CREATE INDEX idx_escalations_mentor  ON escalations(assigned_mentor_id, status);
CREATE INDEX idx_escalations_session ON escalations(session_id);

COMMENT ON TABLE  escalations                  IS 'Human intervention requests. Actioned by assigned mentor.';
COMMENT ON COLUMN escalations.evidence_snapshot IS 'Snapshot of signals that triggered this escalation.';

-- V014: AI Interactions Log
-- Records every AI Companion turn for audit, quality review, and safety checks.

CREATE TABLE ai_interactions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID         NOT NULL REFERENCES sessions(id)     ON DELETE RESTRICT,
  learner_id       UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  tenant_id        UUID         NOT NULL REFERENCES tenants(id)      ON DELETE RESTRICT,
  task_id          UUID                  REFERENCES session_tasks(id) ON DELETE SET NULL,
  competency_id    UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  resource_id      UUID                  REFERENCES resources(id)    ON DELETE SET NULL,

  -- The conversation turn
  mode             VARCHAR(50)  NOT NULL DEFAULT 'free_question'
                     CHECK (mode IN ('free_question','hint_request','explain_concept','check_answer','session_summary')),
  learner_input    TEXT         NOT NULL,
  context_snapshot JSONB,       -- Twin state + current task snapshot at time of request
  ai_response      TEXT,
  ai_model         VARCHAR(100),                       -- 'gpt-4o' | 'gemini-pro' | 'mock'
  prompt_tokens    INT,
  response_tokens  INT,
  latency_ms       INT,

  -- Safety
  safety_checked   BOOLEAN      NOT NULL DEFAULT false,
  safety_passed    BOOLEAN,
  safety_flags     TEXT[],                             -- Any flags raised

  -- Outcome
  was_helpful      BOOLEAN,     -- Set retroactively from learner feedback
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_session  ON ai_interactions(session_id, created_at);
CREATE INDEX idx_ai_learner  ON ai_interactions(learner_id, created_at DESC);
CREATE INDEX idx_ai_safety   ON ai_interactions(tenant_id, safety_passed) WHERE safety_passed = false;

COMMENT ON TABLE  ai_interactions                  IS 'Full audit log of every AI Companion turn.';
COMMENT ON COLUMN ai_interactions.context_snapshot IS 'Non-PII snapshot for audit. Retained 90 days (shorter than other events).';
COMMENT ON COLUMN ai_interactions.safety_checked   IS 'Whether the content safety filter was applied before delivery.';

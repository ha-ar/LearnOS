-- V021: Recommendation Log & Evidence Engine Audit
-- Records every recommendation made (for transparency) and every evidence run (for audit).

-- Every recommendation the engine makes, with which rule fired
CREATE TABLE recommendation_log (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID         NOT NULL REFERENCES sessions(id)     ON DELETE RESTRICT,
  learner_id      UUID         NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  task_id         UUID                  REFERENCES session_tasks(id) ON DELETE SET NULL,
  action_type     VARCHAR(100) NOT NULL,  -- 'continue' | 'switch_resource' | 'mentor_escalation' | etc.
  rule_fired      VARCHAR(100) NOT NULL,  -- Named rule constant, e.g. 'escalation_threshold_rule'
  confidence      VARCHAR(50)  NOT NULL DEFAULT 'medium'
                    CHECK (confidence IN ('low','medium','high')),
  evidence        JSONB        NOT NULL DEFAULT '[]',  -- Array of supporting signals
  acted_upon      BOOLEAN,                              -- Did the system act on this?
  outcome         VARCHAR(50)
                    CHECK (outcome IN ('helped','neutral','not_helpful','ignored')),
  recommended_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rec_log_session ON recommendation_log(session_id, recommended_at);
CREATE INDEX idx_rec_log_learner ON recommendation_log(learner_id, recommended_at DESC);

COMMENT ON TABLE  recommendation_log           IS 'Audit of every recommendation made by the Recommendation Engine.';
COMMENT ON COLUMN recommendation_log.rule_fired IS 'Named rule constant — no opaque decisions allowed.';
COMMENT ON COLUMN recommendation_log.outcome   IS 'Set retroactively: training data for future ML.';

-- Evidence Engine run audit
CREATE TABLE evidence_runs (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID         NOT NULL REFERENCES sessions(id)  ON DELETE RESTRICT,
  learner_id            UUID         NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
  run_type              VARCHAR(50)  NOT NULL DEFAULT 'full'
                          CHECK (run_type IN ('full','incremental')),
  events_processed      INT          NOT NULL DEFAULT 0,
  competencies_updated  INT          NOT NULL DEFAULT 0,
  mastery_changes       JSONB        NOT NULL DEFAULT '[]',  -- [{competency_id, from, to}]
  duration_ms           INT,
  run_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE evidence_runs IS 'Audit log of every Evidence Engine run. Links competency changes to evidence.';

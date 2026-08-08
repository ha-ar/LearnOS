-- V019: Safety Flags
-- Records content safety events — AI responses blocked, distress signals detected, etc.

CREATE TABLE safety_flags (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID         NOT NULL REFERENCES sessions(id)       ON DELETE RESTRICT,
  learner_id          UUID         NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
  tenant_id           UUID         NOT NULL REFERENCES tenants(id)        ON DELETE RESTRICT,
  ai_interaction_id   UUID                  REFERENCES ai_interactions(id) ON DELETE SET NULL,

  flag_type           VARCHAR(100) NOT NULL,
               -- 'external_url' | 'inappropriate_content' | 'off_topic'
               -- | 'personal_claims' | 'mental_health_signal' | 'formal_assessment'
  severity            VARCHAR(50)  NOT NULL DEFAULT 'low'
                        CHECK (severity IN ('low','medium','high')),
  content_snippet     TEXT,        -- First 200 chars of flagged content (no PII)
  action_taken        VARCHAR(100) NOT NULL
                        CHECK (action_taken IN ('blocked','modified','logged_only','mentor_notified')),
  mentor_notified     BOOLEAN      NOT NULL DEFAULT false,
  mentor_notified_at  TIMESTAMPTZ,
  reviewed_by         UUID                  REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  review_note         TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_safety_tenant   ON safety_flags(tenant_id, created_at DESC);
CREATE INDEX idx_safety_high     ON safety_flags(tenant_id, severity, created_at DESC) WHERE severity = 'high';
CREATE INDEX idx_safety_unreviewed ON safety_flags(tenant_id, reviewed_at) WHERE reviewed_at IS NULL;

COMMENT ON TABLE  safety_flags              IS 'Content safety events. High severity triggers immediate mentor notification.';
COMMENT ON COLUMN safety_flags.flag_type    IS 'Category of safety concern detected.';
COMMENT ON COLUMN safety_flags.severity     IS 'low = log only; medium = log + flag; high = block + notify mentor immediately.';

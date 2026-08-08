-- V018: Consent Records
-- Guardian consent for data collection. Required before any learner session begins.

CREATE TABLE consent_records (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  guardian_id     UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_version VARCHAR(50)  NOT NULL,   -- Version of the consent document shown
  data_scope      TEXT[]       NOT NULL,   -- e.g. ['session_events', 'twin', 'reports']
  consent_method  VARCHAR(100) NOT NULL DEFAULT 'admin_recorded'
                    CHECK (consent_method IN ('digital_signature','admin_recorded','paper_form')),
  consented_at    TIMESTAMPTZ  NOT NULL,
  revoked_at      TIMESTAMPTZ,             -- NULL = active consent
  ip_address      INET,
  admin_who_recorded UUID      REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (learner_id, consent_version)
);

CREATE INDEX idx_consent_learner ON consent_records(learner_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE  consent_records             IS 'Guardian consent records. Must exist before learner sessions begin.';
COMMENT ON COLUMN consent_records.data_scope  IS 'Array of data categories consented to.';
COMMENT ON COLUMN consent_records.revoked_at  IS 'NULL = consent active. Set when guardian withdraws consent.';

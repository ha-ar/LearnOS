-- V022: Tenant Configuration & Data Requests
-- Per-tenant settings (active curriculum, subjects, grade range).
-- Data export/deletion requests for GDPR-style compliance.

CREATE TABLE tenant_config (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID         NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  active_curriculum_id UUID                  REFERENCES curricula(id)  ON DELETE SET NULL,
  active_subjects      TEXT[]       NOT NULL DEFAULT '{"Mathematics"}',
  grade_min            INT          NOT NULL DEFAULT 6,
  grade_max            INT          NOT NULL DEFAULT 8,
  settings             JSONB        NOT NULL DEFAULT '{}',   -- Extensible config bag
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by           UUID                  REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE tenant_config IS 'Per-tenant configuration (curriculum, subjects, grade range).';

-- GDPR-style data requests (export and deletion)
CREATE TABLE data_requests (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id     UUID         NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  requested_by   UUID                  REFERENCES users(id)   ON DELETE SET NULL,
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  request_type   VARCHAR(50)  NOT NULL
                   CHECK (request_type IN ('export','deletion')),
  status         VARCHAR(50)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','completed','failed')),
  notes          TEXT,
  requested_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  file_url       TEXT         -- For export: signed URL to download zip
);

CREATE INDEX idx_data_requests_tenant ON data_requests(tenant_id, status);

COMMENT ON TABLE data_requests IS 'Guardian-initiated data export and deletion requests.';

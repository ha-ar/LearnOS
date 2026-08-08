-- V020: Audit Log
-- Immutable record of all system actions for accountability and compliance.
-- Never updated, never deleted. Archive after 2 years.

CREATE TABLE audit_log (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       UUID                  REFERENCES users(id) ON DELETE SET NULL,
  actor_role     VARCHAR(50),
  tenant_id      UUID                  REFERENCES tenants(id) ON DELETE SET NULL,
  action         VARCHAR(100) NOT NULL,   -- e.g. 'user.create', 'report.view', 'consent.record'
  resource_type  VARCHAR(100),            -- e.g. 'learner_profile', 'session', 'ai_interaction'
  resource_id    UUID,
  ip_address     INET,
  user_agent     TEXT,
  payload_summary TEXT,                   -- Non-sensitive summary (no passwords/tokens)
  result         VARCHAR(50)  NOT NULL DEFAULT 'success'
                   CHECK (result IN ('success','failure','blocked')),
  reason         TEXT,                    -- Reason if result = 'blocked' or 'failure'
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor    ON audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_tenant   ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_action   ON audit_log(action, created_at DESC);

COMMENT ON TABLE audit_log IS 'Immutable system audit log. Never update or delete rows.';
COMMENT ON COLUMN audit_log.action IS
  'Namespaced action: user.create, user.login, report.view, consent.record, '
  'data.export, escalation.resolve, safety.flag, admin.deactivate_user, etc.';

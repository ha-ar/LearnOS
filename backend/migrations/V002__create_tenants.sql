-- V002: Tenants
-- Multi-tenant root table. All data is scoped to a tenant.

CREATE TABLE tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  type        VARCHAR(50)  NOT NULL DEFAULT 'learning_centre',
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  tenants      IS 'One row per learning centre (or future platform tenant).';
COMMENT ON COLUMN tenants.type IS 'learning_centre | enterprise | pilot';

-- V029: Add code/region/version to curricula
-- The admin web app's Curriculum type (web/admin/src/types.ts) has always
-- expected these fields, and AdminService.listCurricula()/getTenantConfig()
-- already queried them — but the columns were never added to the table,
-- so GET /api/admin/config/active and /api/admin/config/curricula 500'd
-- on every call.

ALTER TABLE curricula
  ADD COLUMN IF NOT EXISTS code    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS version VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uq_curricula_code ON curricula(code) WHERE code IS NOT NULL;

COMMENT ON COLUMN curricula.code    IS 'Short machine-friendly identifier shown in the admin UI, e.g. IB, PK-NC-2006.';
COMMENT ON COLUMN curricula.region  IS 'Broad region the curriculum applies to, e.g. South Asia, International.';
COMMENT ON COLUMN curricula.version IS 'Curriculum edition/version label, e.g. 2006, PYP/MYP.';

UPDATE curricula SET code = 'PK-NC-2006', region = 'South Asia', version = '2006'
  WHERE name = 'Pakistan National Curriculum 2006' AND code IS NULL;

UPDATE curricula SET code = 'IB', region = 'International', version = 'PYP/MYP'
  WHERE name = 'International Baccalaureate' AND code IS NULL;

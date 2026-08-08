-- V003: Users & Learner Profiles

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL
                  CHECK (role IN ('learner','mentor','parent','admin','superadmin')),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant  ON users(tenant_id);
CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(tenant_id, role);

COMMENT ON TABLE  users           IS 'All system users across all roles.';
COMMENT ON COLUMN users.role      IS 'learner | mentor | parent | admin | superadmin';
COMMENT ON COLUMN users.tenant_id IS 'Superadmin users still belong to a tenant (their own org).';

-- Extended profile for learners only
CREATE TABLE learner_profiles (
  learner_id       UUID  PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  guardian_id      UUID  REFERENCES users(id) ON DELETE SET NULL,
  grade            VARCHAR(50),
  curriculum_id    UUID,                       -- FK added after V006
  date_of_birth    DATE,
  consent_given    BOOLEAN      NOT NULL DEFAULT false,
  consent_given_at TIMESTAMPTZ
);

COMMENT ON TABLE learner_profiles IS 'One row per learner user. Extends users table.';

-- Link table: which mentor is assigned to which learners
CREATE TABLE learner_mentor_assignments (
  learner_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  assigned_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  assigned_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (learner_id, mentor_id)
);

CREATE INDEX idx_lma_mentor ON learner_mentor_assignments(mentor_id) WHERE is_active = true;

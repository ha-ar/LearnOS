-- ============================================================
-- LearnOS: Seed 1 user for each role
-- Roles: learner, mentor, parent, admin, superadmin
-- Password for all: LearnOS2026!
-- ============================================================

-- Ensure default tenant exists
INSERT INTO tenants (id, name, type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pilot School Network', 'pilot')
ON CONFLICT (id) DO NOTHING;

-- 1. Learner: Zuha Ali
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  'zuha.ali@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
  'Zuha Ali',
  'learner',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

-- 2. Mentor: Ms. Nadia
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000002',
  'mentor@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
  'Ms. Nadia',
  'mentor',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

-- 3. Parent: Mr. Ali
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000003',
  'parent@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
  'Mr. Ali',
  'parent',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

-- 4. Admin: Admin User
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000004',
  'admin@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
  'Admin User',
  'admin',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

-- 5. Superadmin: Super Admin
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000005',
  'superadmin@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO',
  'Super Admin',
  'superadmin',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;

-- Learner profile link
INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id, consent_given, consent_given_at)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  'Grade 7',
  (SELECT id FROM curricula WHERE name = 'International Baccalaureate'),
  true,
  NOW()
)
ON CONFLICT (learner_id) DO UPDATE SET guardian_id = EXCLUDED.guardian_id, curriculum_id = EXCLUDED.curriculum_id;

-- Mentor assignment
INSERT INTO learner_mentor_assignments (learner_id, mentor_id, tenant_id, is_active, assigned_at)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  true,
  NOW()
)
ON CONFLICT (learner_id, mentor_id) DO UPDATE SET is_active = true;

-- Guardian consent record
INSERT INTO consent_records (learner_id, guardian_id, consent_version, data_scope, consent_method, consented_at)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  'v1.0',
  ARRAY['session_events','twin','reports','ai_interactions'],
  'admin_recorded',
  NOW()
)
ON CONFLICT (learner_id, consent_version) DO NOTHING;

-- Confirm list of seeded users
SELECT id, email, name, role FROM users ORDER BY role, email;

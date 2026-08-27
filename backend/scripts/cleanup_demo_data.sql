-- ============================================================
-- LearnOS: Remove pilot/demo accounts from an ALREADY-SEEDED
-- database and seed the one real student, Zuha Ali (Grade 7).
--
-- Use this against a database that already has the old
-- seed_mvp.sql data loaded (e.g. your live Cloud Run Postgres).
-- It does NOT touch curriculum, competencies, resources, or quiz
-- content — only the six demo accounts (Ahmed, Sara, Omar,
-- Ms. Nadia, Mr. Khan Sr., Admin User) and all activity data tied
-- to them (sessions, events, escalations, notes, reports, twin
-- state, consent records).
--
-- Run it with:
--   psql "$DATABASE_URL" -f scripts/cleanup_demo_data.sql
-- (swap $DATABASE_URL for your Cloud Run Postgres connection string)
--
-- Safe to run more than once — every step is guarded.
-- ============================================================

DO $$
DECLARE
  demo_ids UUID[] := ARRAY[
    '10000000-0000-0000-0000-000000000001', -- Ahmed Khan (learner)
    '10000000-0000-0000-0000-000000000002', -- Sara Malik (learner)
    '10000000-0000-0000-0000-000000000003', -- Omar Farooq (learner)
    '20000000-0000-0000-0000-000000000001', -- Ms. Nadia (mentor)
    '30000000-0000-0000-0000-000000000001', -- Mr. Khan Sr. (parent)
    '40000000-0000-0000-0000-000000000001'  -- Admin User (admin)
  ]::UUID[];
BEGIN
  -- Children first (most FKs here are ON DELETE RESTRICT, so the
  -- user rows can't be deleted until these are gone).
  DELETE FROM ai_interactions        WHERE learner_id = ANY(demo_ids);
  DELETE FROM session_events         WHERE learner_id = ANY(demo_ids);
  DELETE FROM escalations            WHERE learner_id = ANY(demo_ids) OR assigned_mentor_id = ANY(demo_ids);
  DELETE FROM mentor_notes           WHERE learner_id = ANY(demo_ids) OR mentor_id = ANY(demo_ids);
  DELETE FROM weekly_reports         WHERE learner_id = ANY(demo_ids) OR parent_id = ANY(demo_ids);
  DELETE FROM recommendation_log     WHERE learner_id = ANY(demo_ids);
  DELETE FROM evidence_runs          WHERE learner_id = ANY(demo_ids);
  DELETE FROM learning_plan_items    WHERE plan_id IN (SELECT id FROM learning_plans WHERE learner_id = ANY(demo_ids));
  DELETE FROM learning_plans         WHERE learner_id = ANY(demo_ids);
  DELETE FROM sessions               WHERE learner_id = ANY(demo_ids);  -- session_tasks cascade with it
  DELETE FROM learner_competency_states WHERE learner_id = ANY(demo_ids);
  DELETE FROM learner_profiles_twin  WHERE learner_id = ANY(demo_ids);
  DELETE FROM learner_goals          WHERE learner_id = ANY(demo_ids);
  DELETE FROM portfolio_items        WHERE learner_id = ANY(demo_ids);
  DELETE FROM consent_records        WHERE learner_id = ANY(demo_ids) OR guardian_id = ANY(demo_ids);
  DELETE FROM learner_mentor_assignments WHERE learner_id = ANY(demo_ids) OR mentor_id = ANY(demo_ids);
  DELETE FROM learner_profiles       WHERE learner_id = ANY(demo_ids);

  -- Now the users themselves (notifications cascade automatically).
  DELETE FROM users WHERE id = ANY(demo_ids);

  RAISE NOTICE 'Demo accounts and their activity data removed.';
END $$;

-- ============================================================
-- Seed the one real student: Zuha Ali, Grade 7
-- No sessions/plans/twin state seeded on purpose — her first
-- session is generated automatically by the backend the moment
-- she logs in (SessionService.generateSessionPlan picks from her
-- grade's competencies).
-- ============================================================
INSERT INTO users (id, email, password_hash, name, role, tenant_id)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  'zuha.ali@learnos.app',
  '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO', -- password: LearnOS2026! — change after first login
  'Zuha Ali', 'learner',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id, consent_given, consent_given_at)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  NULL,
  'Grade 7',
  'a0000000-0000-0000-0000-000000000001',
  true,
  NOW()
)
ON CONFLICT (learner_id) DO NOTHING;

-- Confirm result
SELECT id, email, name, role FROM users ORDER BY created_at;

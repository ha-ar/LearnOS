-- ============================================================
-- LearnOS: Point Zuha Ali (and the tenant) at the IB curriculum.
--
-- Run this AFTER `npm run import:curriculum` has loaded
-- seed/curriculum_ib.json into this database (that step creates
-- the "International Baccalaureate" curricula row this script
-- looks up by name).
--
-- Run with:
--   psql "$DATABASE_URL" -f scripts/assign_zuha_ib.sql
-- or paste into a `gcloud sql connect` psql session.
--
-- Safe to run more than once.
-- ============================================================

UPDATE learner_profiles
SET curriculum_id = (SELECT id FROM curricula WHERE name = 'International Baccalaureate')
WHERE learner_id = '50000000-0000-0000-0000-000000000001';

UPDATE tenant_config
SET active_curriculum_id = (SELECT id FROM curricula WHERE name = 'International Baccalaureate'),
    active_subjects = ARRAY['Math','Science','Computer Science','English'],
    grade_min = 1,
    grade_max = 10
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Confirm
SELECT u.name, lp.grade, c.name AS curriculum, c.id AS curriculum_id
FROM learner_profiles lp
JOIN users u ON u.id = lp.learner_id
LEFT JOIN curricula c ON c.id = lp.curriculum_id
WHERE lp.learner_id = '50000000-0000-0000-0000-000000000001';

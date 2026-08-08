-- V012: Learning Plans
-- A term-level plan mapping the sequence of competencies a learner will study.
-- Drives session plan generation.

CREATE TABLE learning_plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id    UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  curriculum_id UUID        NOT NULL REFERENCES curricula(id)  ON DELETE RESTRICT,
  term_label    VARCHAR(100),           -- e.g. 'Term 1 2026'
  subject       VARCHAR(100),
  status        VARCHAR(50) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','completed','archived')),
  created_by    UUID                 REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_learner ON learning_plans(learner_id) WHERE status = 'active';

COMMENT ON TABLE learning_plans IS 'Term-level learning plan for a learner in a subject.';

-- Ordered sequence of competencies within a plan
CREATE TABLE learning_plan_items (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               UUID        NOT NULL REFERENCES learning_plans(id)  ON DELETE CASCADE,
  competency_id         UUID        NOT NULL REFERENCES competencies(id)     ON DELETE RESTRICT,
  sequence_order        INT         NOT NULL,
  target_mastery_level  VARCHAR(50) NOT NULL DEFAULT 'proficient'
                          CHECK (target_mastery_level IN ('developing','proficient','mastered')),
  target_completion_date DATE,
  status                VARCHAR(50) NOT NULL DEFAULT 'not_started'
                          CHECK (status IN ('not_started','in_progress','completed','skipped')),
  UNIQUE (plan_id, sequence_order),
  UNIQUE (plan_id, competency_id)
);

CREATE INDEX idx_plan_items_plan ON learning_plan_items(plan_id, sequence_order);

COMMENT ON TABLE  learning_plan_items                IS 'Ordered competency sequence within a learning plan.';
COMMENT ON COLUMN learning_plan_items.sequence_order IS 'The order in which competencies should be studied.';

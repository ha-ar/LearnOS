-- V006: Curricula
-- Describes the academic syllabus a centre follows.
-- MVP: Pakistan National Curriculum 2006 (Mathematics).

CREATE TABLE curricula (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  country     VARCHAR(100),
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE curricula IS 'Academic curricula catalogue. A centre activates one curriculum per subject.';

-- Now that curricula exists, we can add the FK on learner_profiles
ALTER TABLE learner_profiles
  ADD CONSTRAINT fk_learner_profiles_curriculum
    FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE SET NULL;

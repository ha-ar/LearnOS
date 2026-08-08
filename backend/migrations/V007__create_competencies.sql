-- V007: Competencies
-- The atomic units of the curriculum — what a learner can or cannot do.
-- Each competency may depend on prerequisite competencies (stored as UUID array).

CREATE TABLE competencies (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id    UUID         NOT NULL REFERENCES curricula(id) ON DELETE RESTRICT,
  subject          VARCHAR(100) NOT NULL,
  topic            VARCHAR(255) NOT NULL,
  subtopic         VARCHAR(255),
  grade_level      VARCHAR(50),
  prerequisite_ids UUID[]       NOT NULL DEFAULT '{}',
  description      TEXT,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competencies_curriculum ON competencies(curriculum_id);
CREATE INDEX idx_competencies_subject    ON competencies(curriculum_id, subject, grade_level);

COMMENT ON TABLE  competencies                  IS 'Atomic learning competencies within a curriculum.';
COMMENT ON COLUMN competencies.prerequisite_ids IS 'Array of competency UUIDs that must be proficient before this one.';
COMMENT ON COLUMN competencies.grade_level      IS 'e.g. Grade 6 — informational, not a hard restriction.';

-- V028: Curriculum sequencing for competencies
-- Supports multi-programme curricula (e.g. IB PYP/MYP) where topics within a
-- subject+grade have a defined teaching order, used to pace daily sessions.

ALTER TABLE competencies
  ADD COLUMN IF NOT EXISTS programme      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sequence_order INT;

COMMENT ON COLUMN competencies.programme      IS 'Curriculum programme stage, e.g. PYP, MYP1..MYP5. Informational, mirrors grade_level.';
COMMENT ON COLUMN competencies.sequence_order IS 'Teaching order of this topic within its curriculum+subject+grade_level. Drives session pacing (1-2 topics/session).';

-- Prevents duplicate topics on re-import and gives ON CONFLICT a target.
CREATE UNIQUE INDEX IF NOT EXISTS uq_competencies_curriculum_sequence
  ON competencies(curriculum_id, subject, grade_level, sequence_order)
  WHERE sequence_order IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_competencies_sequence
  ON competencies(curriculum_id, subject, grade_level, sequence_order);

-- V025: Resource Outcomes & Feedback Tracking
-- Records learner interactions with specific resources, time spent, quiz outcomes, and confidence ratings.

CREATE TABLE resource_outcomes (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id               UUID         NOT NULL REFERENCES resources(id)    ON DELETE CASCADE,
  learner_id                UUID         NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  session_id                UUID                  REFERENCES sessions(id)     ON DELETE SET NULL,
  competency_id             UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  used_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  time_spent_sec            INT          DEFAULT 0,
  check_questions_attempted INT          DEFAULT 0,
  check_questions_correct   INT          DEFAULT 0,
  learner_confidence_after  INT          CHECK (learner_confidence_after BETWEEN 1 AND 5),
  outcome_label             VARCHAR(50)  CHECK (outcome_label IN ('helped', 'neutral', 'did_not_help', 'too_hard', 'too_easy'))
);

CREATE INDEX idx_resource_outcomes_learner  ON resource_outcomes(learner_id, used_at DESC);
CREATE INDEX idx_resource_outcomes_resource ON resource_outcomes(resource_id);
CREATE INDEX idx_resource_outcomes_session  ON resource_outcomes(session_id);

COMMENT ON TABLE  resource_outcomes                          IS 'Feedback and performance evidence collected after learner completes or interacts with a resource.';
COMMENT ON COLUMN resource_outcomes.outcome_label            IS 'Categorized outcome signal used by Resource Ranking engine.';
COMMENT ON COLUMN resource_outcomes.learner_confidence_after IS 'Learner self-reported confidence score (1-5).';

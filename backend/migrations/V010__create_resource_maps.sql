-- V010: Resource Maps & Quiz Questions
-- Links resources to competencies, and stores quiz question content.

CREATE TABLE resource_competency_map (
  resource_id    UUID        NOT NULL REFERENCES resources(id)     ON DELETE CASCADE,
  competency_id  UUID        NOT NULL REFERENCES competencies(id)  ON DELETE CASCADE,
  fit_type       VARCHAR(50) NOT NULL DEFAULT 'primary'
                   CHECK (fit_type IN ('primary','supplementary','fallback','enrichment')),
  PRIMARY KEY (resource_id, competency_id)
);

CREATE INDEX idx_rcm_competency ON resource_competency_map(competency_id, fit_type);

COMMENT ON TABLE  resource_competency_map          IS 'Which resources teach which competencies.';
COMMENT ON COLUMN resource_competency_map.fit_type IS 'primary = best fit; fallback = alternative; enrichment = extension.';

-- Internal quiz questions (for resources of format = internal_quiz)
CREATE TABLE quiz_questions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id     UUID         NOT NULL REFERENCES resources(id)    ON DELETE CASCADE,
  competency_id   UUID                  REFERENCES competencies(id) ON DELETE SET NULL,
  question_text   TEXT         NOT NULL,
  question_type   VARCHAR(50)  NOT NULL DEFAULT 'multiple_choice'
                    CHECK (question_type IN ('multiple_choice','true_false','short_answer')),
  options         JSONB,       -- [{ "key": "a", "text": "2/4" }, ...]
  correct_answer  VARCHAR(10)  NOT NULL,  -- key value e.g. "b"
  explanation     TEXT,
  difficulty      VARCHAR(50)  NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy','medium','hard')),
  grade_level     INT,
  display_order   INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_resource ON quiz_questions(resource_id, display_order);

COMMENT ON TABLE  quiz_questions         IS 'Multiple-choice questions for internal_quiz resources.';
COMMENT ON COLUMN quiz_questions.options IS 'JSON array: [{key, text}]. key matches correct_answer.';

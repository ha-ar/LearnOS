-- V008: Digital Twin — Learner Model
-- Core representation of what each learner knows and how they learn.
-- This is NOT inferred from a black-box model; every field is traceable to evidence.

-- Per-competency mastery state (the "knowledge map")
CREATE TABLE learner_competency_states (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competency_id     UUID         NOT NULL REFERENCES competencies(id) ON DELETE RESTRICT,
  mastery_level     VARCHAR(50)  NOT NULL DEFAULT 'not_started'
                      CHECK (mastery_level IN ('not_started','emerging','developing','proficient','mastered','needs_review')),
  mastery_score     NUMERIC(4,2),          -- 0.00–1.00, derived from attempts
  attempts_total    INT          NOT NULL DEFAULT 0,
  attempts_correct  INT          NOT NULL DEFAULT 0,
  learner_confidence INT          CHECK (learner_confidence BETWEEN 1 AND 5),
  last_practiced_at TIMESTAMPTZ,
  review_due_at     TIMESTAMPTZ,           -- Spaced repetition target date
  evidence_summary  TEXT,                  -- Human-readable, links to events
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (learner_id, competency_id)
);

CREATE INDEX idx_lcs_learner    ON learner_competency_states(learner_id);
CREATE INDEX idx_lcs_review_due ON learner_competency_states(review_due_at) WHERE mastery_level != 'not_started';

COMMENT ON TABLE  learner_competency_states              IS 'Evidence-backed mastery state per learner per competency.';
COMMENT ON COLUMN learner_competency_states.mastery_score IS 'Ratio: attempts_correct / attempts_total, weighted by recency.';
COMMENT ON COLUMN learner_competency_states.review_due_at IS 'Spaced repetition: when to revisit this competency.';

-- Learner learning-style profile (preferences, not labels)
CREATE TABLE learner_profiles_twin (
  learner_id                  UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_format            VARCHAR(100),  -- 'video' | 'article' | 'interactive' | 'mixed'
  preferred_session_length_min INT,
  hint_response               VARCHAR(50),   -- 'benefits_from_hints' | 'prefers_to_try_first' | 'unknown'
  pace_signal                 VARCHAR(50),   -- 'fast' | 'average' | 'slow' | 'unknown'
  notes                       TEXT,          -- Mentor-authored free notes
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  learner_profiles_twin              IS 'Learning preferences and patterns — updated by mentors and evidence engine.';
COMMENT ON COLUMN learner_profiles_twin.pace_signal  IS 'Observed pace, not a fixed label. Can change over time.';

-- Learner goals
CREATE TABLE learner_goals (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type   VARCHAR(50)           -- 'academic' | 'personal' | 'session'
                CHECK (goal_type IN ('academic','personal','session')),
  description TEXT         NOT NULL,
  target_date DATE,
  status      VARCHAR(50)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','achieved','paused','cancelled')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Portfolio items (evidence of learning beyond check questions)
CREATE TABLE portfolio_items (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type       VARCHAR(50)           -- 'project' | 'written_work' | 'mentor_observation'
                    CHECK (item_type IN ('project','written_work','mentor_observation','assessment','other')),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  file_url        TEXT,
  competency_ids  UUID[]       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE portfolio_items IS 'Artefacts of learning that form the learner portfolio.';

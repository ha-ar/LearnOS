-- V009: Resource Catalogue
-- Approved learning resources curated for each competency.
-- MVP: Khan Academy deep links + internal quizzes/articles.

CREATE TABLE resource_providers (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  type              VARCHAR(100) NOT NULL DEFAULT 'deep_link'
                      CHECK (type IN ('deep_link','internal','embedded','api')),
  base_url          TEXT,
  attribution_text  TEXT,
  terms_url         TEXT,
  age_min           INT          NOT NULL DEFAULT 5,
  age_max           INT          NOT NULL DEFAULT 18,
  integration_notes TEXT,
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  resource_providers      IS 'Approved content providers (e.g. Khan Academy, internal).';
COMMENT ON COLUMN resource_providers.type IS 'deep_link = open URL in WebView; internal = served by LearnOS.';

CREATE TABLE resources (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID         NOT NULL REFERENCES resource_providers(id) ON DELETE RESTRICT,
  external_id  VARCHAR(255),              -- Provider's own ID for the resource
  title        VARCHAR(500) NOT NULL,
  description  TEXT,
  format       VARCHAR(100) NOT NULL
                 CHECK (format IN ('video','article','internal_quiz','interactive','worked_example','audio','other')),
  url          TEXT,                      -- Public URL (for deep_link type)
  embed_url    TEXT,                      -- Embeddable URL variant (if different)
  duration_min INT,
  grade_min    INT,
  grade_max    INT,
  language     VARCHAR(10)  NOT NULL DEFAULT 'en',
  is_age_safe  BOOLEAN      NOT NULL DEFAULT true,
  thumbnail_url TEXT,
  attribution  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_provider ON resources(provider_id) WHERE is_active = true;
CREATE INDEX idx_resources_format   ON resources(format)      WHERE is_active = true;

COMMENT ON TABLE  resources           IS 'Curated learning resources, approved for use in LearnOS sessions.';
COMMENT ON COLUMN resources.format    IS 'video | article | internal_quiz | interactive | worked_example';
COMMENT ON COLUMN resources.is_age_safe IS 'Must be verified true before resource is shown to learners.';

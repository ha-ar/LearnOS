-- V027: Add content_body to resources
-- Supports internal pre-compiled and AI-generated lesson content.
-- Khan Academy deep links are no longer used; all content is internal.

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS content_body          TEXT,
  ADD COLUMN IF NOT EXISTS content_generated_at  TIMESTAMPTZ;

COMMENT ON COLUMN resources.content_body         IS 'Pre-compiled or AI-generated lesson markdown/text stored internally.';
COMMENT ON COLUMN resources.content_generated_at IS 'When AI last generated or refreshed this content_body.';

-- Widen the type check to allow 'ai_generated' format
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_format_check;
ALTER TABLE resources
  ADD CONSTRAINT resources_format_check
  CHECK (format IN ('article','internal_quiz','interactive','worked_example','audio','ai_lesson','other'));

-- Update provider type check to remove deep_link requirement
ALTER TABLE resource_providers DROP CONSTRAINT IF EXISTS resource_providers_type_check;
ALTER TABLE resource_providers
  ADD CONSTRAINT resource_providers_type_check
  CHECK (type IN ('internal','embedded','api'));

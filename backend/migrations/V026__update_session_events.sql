-- V026: Update Session Events schema with canonical fields
-- Adds device_id, ai_interaction_id, mentor_id, and received_at

ALTER TABLE session_events
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_interaction_id UUID REFERENCES ai_interactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_events_received_at ON session_events(session_id, received_at ASC);

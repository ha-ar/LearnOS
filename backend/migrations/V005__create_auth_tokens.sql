-- V005: Auth Tokens
-- Stores refresh token hashes for JWT rotation.
-- Access tokens are stateless (JWT); only refresh tokens are persisted.

CREATE TABLE refresh_tokens (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(512) NOT NULL UNIQUE,  -- SHA-256 of the raw refresh token
  device_id    UUID         REFERENCES devices(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ  NOT NULL,
  revoked_at   TIMESTAMPTZ,                   -- NULL = still valid
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE  refresh_tokens            IS 'Persisted refresh token hashes for JWT rotation.';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Never store the raw token. Store SHA-256(token) only.';

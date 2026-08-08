-- V004: Devices
-- Each physical device at a centre is registered and given a secure token.
-- The client app uses this token to authenticate API calls from a device context.

CREATE TABLE devices (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  room           VARCHAR(100),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_token   VARCHAR(512) NOT NULL UNIQUE,  -- 256-bit random, stored as hex
  platform       VARCHAR(50)  DEFAULT 'macos'   -- 'macos' | 'windows' | 'ios'
                   CHECK (platform IN ('macos','windows','ios','android','other')),
  os_version     VARCHAR(100),
  app_version    VARCHAR(50),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  registered_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_seen_at   TIMESTAMPTZ
);

CREATE INDEX idx_devices_tenant ON devices(tenant_id) WHERE is_active = true;

COMMENT ON TABLE  devices              IS 'Physical devices registered to a centre.';
COMMENT ON COLUMN devices.device_token IS 'Secure 256-bit random token. Presented in X-Device-Token header.';

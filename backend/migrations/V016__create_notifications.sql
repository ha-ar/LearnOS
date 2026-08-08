-- V016: Notifications
-- Internal notification queue for mentor alerts and system messages.
-- MVP: polled by mentor dashboard every 30s. Future: WebSocket push.

CREATE TABLE notifications (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID         NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type         VARCHAR(100) NOT NULL,
               -- 'new_escalation' | 'escalation_resolved' | 'session_started'
               -- | 'safety_alert' | 'report_ready' | 'system'
  title        VARCHAR(255) NOT NULL,
  body         TEXT,
  data         JSONB        NOT NULL DEFAULT '{}',   -- e.g. { "escalation_id": "..." }
  is_read      BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  read_at      TIMESTAMPTZ
);

CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read, created_at DESC)
  WHERE is_read = false;

COMMENT ON TABLE notifications IS 'Notification queue. Polled by clients; future: pushed via WebSocket.';

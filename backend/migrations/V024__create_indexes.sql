-- V024: Performance Indexes
-- Additional composite and covering indexes for common query patterns.
-- Core table indexes are already created in their respective migrations.
-- This migration adds cross-table query optimisations.

-- Session lookup: mentor dashboard — "show me all active sessions for my tenant"
CREATE INDEX idx_sessions_tenant_mentor
  ON sessions(tenant_id, mentor_id, planned_at DESC)
  WHERE status IN ('active','planned');

-- Competency state lookup: "what does this learner know?" (twin query)
CREATE INDEX idx_lcs_mastery_filter
  ON learner_competency_states(learner_id, mastery_level, updated_at DESC)
  WHERE mastery_level != 'not_started';

-- AI cost monitoring: tokens per session
CREATE INDEX idx_ai_tokens
  ON ai_interactions(session_id, created_at)
  INCLUDE (prompt_tokens, response_tokens);

-- Event log: "show me all check question events for this learner on this competency"
CREATE INDEX idx_events_check_questions
  ON session_events(learner_id, competency_id, event_type, timestamp DESC)
  WHERE event_type IN ('check_question_correct','check_question_incorrect','check_completed');

-- Audit log: compliance report — "all actions in a date range for a tenant"
CREATE INDEX idx_audit_compliance
  ON audit_log(tenant_id, created_at DESC)
  INCLUDE (actor_id, action, resource_type, result);

-- Escalation queue: mentor dashboard unread queue
CREATE INDEX idx_escalations_queue
  ON escalations(tenant_id, assigned_mentor_id, created_at DESC)
  WHERE status = 'pending';

-- Weekly reports: parent portal latest report
CREATE INDEX idx_reports_latest
  ON weekly_reports(parent_id, week_start DESC)
  WHERE status IN ('ready','sent');

COMMENT ON INDEX idx_sessions_tenant_mentor   IS 'Mentor dashboard: active sessions for tenant.';
COMMENT ON INDEX idx_lcs_mastery_filter       IS 'Twin: non-trivial competency states for a learner.';
COMMENT ON INDEX idx_events_check_questions   IS 'Evidence engine: check question events by learner+competency.';

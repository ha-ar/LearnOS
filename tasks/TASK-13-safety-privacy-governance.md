# TASK-13: Safety, Privacy & Data Governance Layer

## Overview
Build the **Safety, Privacy & Data Governance Layer** — the cross-cutting system that enforces child data protection, content safety, access controls, and audit compliance across all LearnOS services. This is **not a legal appendix** — it is a **product requirement** that must be built into the system from day one.

## Context (from LearnOS Product Document)
> "Because LearnOS serves children and stores learning data, trust is a product requirement — not a legal appendix. The system must be designed with child protection, content safety, data minimisation, parent/guardian consent, access controls and transparent recommendations from day one."

Key risks from the document:
- **Child-data and safety risk** → Mitigation: "Data minimisation, consent, access controls, age-safe policies, auditability and incident processes."
- **AI inaccuracy or poor tutoring** → Mitigation: "Ground responses in approved context, test/evaluate, use bounded tools and escalate to mentors."

---

## Control Areas (from Product Document)

| Control Area | Minimum Expectation |
|-------------|---------------------|
| **Data minimisation** | Collect only data necessary for an educational decision; no biometric or ambient surveillance by default |
| **Consent and control** | Clear guardian consent, age-appropriate notices, data export and deletion process where applicable |
| **AI safeguards** | Approved use cases, age-appropriate responses, prompt/tool controls, escalation for sensitive conversations |
| **Explainability** | Show the evidence basis for mentor and parent-facing recommendations |
| **Human oversight** | Human review for high-impact interventions, formal assessment, safety flags and content decisions |
| **Security** | Encryption in transit and at rest, least privilege, audit logging, backups and incident procedures |

---

## Components to Build

### 1. Content Safety Filter

Applied to all AI Companion responses before they reach the learner.

```typescript
interface ContentSafetyResult {
  safe: boolean;
  risk_level: 'none' | 'low' | 'medium' | 'high';
  flags: SafetyFlag[];
  filtered_response: string | null;
  should_escalate_to_mentor: boolean;
}

enum SafetyFlag {
  EXTERNAL_URL = 'external_url',          // Response contains unapproved external link
  OFF_TOPIC = 'off_topic',                // Not related to current subject
  INAPPROPRIATE_CONTENT = 'inappropriate', // Adult/violent/harmful content
  PERSONAL_CLAIMS = 'personal_claims',    // Unsupported claims about learner ability
  MENTAL_HEALTH_SIGNAL = 'mental_health', // Possible distress language from learner
  FORMAL_ASSESSMENT = 'formal_assessment', // AI attempting formal grading
}
```

**Rules for MVP:**
- Block any response containing external URLs not in an approved whitelist
- Block any response making definitive statements about learner intelligence ("You are bad at maths")
- Flag (and send to mentor) any learner input containing distress language keywords
- Block formal grading language ("I grade you a B+")
- Log all flagged responses with the flag reason

```sql
CREATE TABLE safety_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  ai_interaction_id UUID REFERENCES ai_interactions(id),
  flag_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),                    -- 'low', 'medium', 'high'
  content_snippet TEXT,                    -- First 200 chars of flagged content
  action_taken VARCHAR(100),               -- 'blocked', 'modified', 'mentor_notified'
  mentor_notified BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. Data Access Control (Row-Level Security)

All database queries must enforce tenant and role boundaries.

**Rules:**
- Learner: only read/write their own records
- Mentor: only read/write records for learners assigned to them
- Parent: only read their child's weekly reports
- Admin: read/write all records in their tenant
- Superadmin: read-only access to any tenant (no data modification)
- No cross-tenant data access is ever permitted

**Implementation:**
```sql
-- Enable Row-Level Security on sensitive tables
ALTER TABLE learner_competency_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Learner can only see their own data
CREATE POLICY learner_own_data ON session_events
  FOR SELECT
  USING (learner_id = current_setting('app.current_user_id')::UUID);

-- Policy: Mentor sees only assigned learners
CREATE POLICY mentor_assigned_learners ON session_events
  FOR SELECT
  USING (
    learner_id IN (
      SELECT learner_id FROM learner_mentor_assignments
      WHERE mentor_id = current_setting('app.current_user_id')::UUID
        AND is_active = true
    )
  );
```

---

### 3. Consent Management

Consent must be obtained before any learner data is collected.

```typescript
interface ConsentRecord {
  learner_id: string;
  guardian_id: string;
  consented_at: Date;
  consent_version: string;      // Version of the consent document shown
  data_scope: string[];         // What data was consented to: ['session_events', 'twin', 'reports']
  consent_method: 'digital_signature' | 'admin_recorded';
  ip_address?: string;
}
```

**Consent gate:** Before a learner's first session, a valid consent record must exist. If no consent → session cannot start → admin is alerted.

```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  guardian_id UUID NOT NULL REFERENCES users(id),
  consent_version VARCHAR(50) NOT NULL,
  data_scope TEXT[] NOT NULL,
  consent_method VARCHAR(100),
  consented_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  admin_who_recorded UUID REFERENCES users(id)
);
```

---

### 4. Data Minimisation Enforcement

A central registry of what data is collected and why.

```typescript
const DATA_COLLECTION_POLICY = {
  session_events: {
    collected: true,
    purpose: 'Track learning progress and evidence mastery',
    retention_days: 730,              // 2 years
    pii_included: false
  },
  ai_interactions: {
    collected: true,
    purpose: 'Provide contextual AI support; audit AI responses',
    retention_days: 365,
    pii_included: false,
    context_snapshot: {
      collected: true,
      purpose: 'Audit trail for AI accountability',
      retention_days: 90              // Shorter retention for audit snapshots
    }
  },
  video_timestamps: {
    collected: true,
    purpose: 'Engagement signal for resource effectiveness',
    retention_days: 365,
    pii_included: false
  },
  biometrics: {
    collected: false,
    reason: 'Not collected — privacy by design'
  },
  location_data: {
    collected: false,
    reason: 'Not collected — unnecessary for learning purpose'
  },
  social_graph: {
    collected: false,
    reason: 'Not collected in MVP — not educationally necessary'
  }
};
```

---

### 5. Audit Logging (System-Wide)

Every data access, write, and admin action must be logged.

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,                           -- Who performed the action (NULL = system)
  actor_role VARCHAR(50),
  tenant_id UUID,
  action VARCHAR(100) NOT NULL,            -- e.g., 'user.create', 'report.view', 'consent.record'
  resource_type VARCHAR(100),              -- e.g., 'learner_profile', 'session', 'ai_interaction'
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  payload_summary TEXT,                    -- Non-sensitive summary (no passwords, no full content)
  result VARCHAR(50),                      -- 'success', 'failure', 'blocked'
  reason TEXT,                             -- Reason if blocked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor_id, created_at);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id, created_at);
```

**Actions that must always be logged:**
- User login / logout
- Learner data access (any GET on Twin/events/reports)
- AI interaction (question sent + response generated)
- Safety flag triggered
- Consent record created or revoked
- Mentor note added
- Admin: user created/deactivated
- Data export or deletion request

---

### 6. Incident Response Protocol (MVP: Basic)

When a safety flag is raised at `severity = 'high'`:
1. Block the AI response immediately
2. Create a `safety_flags` record
3. Send an immediate notification to all mentors in the session's tenant
4. Log to audit_log with `action = 'safety.high_severity_flag'`
5. The learner sees: "Your session has been paused. Your mentor will be with you shortly."

```
POST /safety/incident               -- Internal API to trigger incident response
Body: { "flag_id": "...", "session_id": "...", "learner_id": "..." }
```

---

### 7. Security Baseline

| Requirement | Implementation |
|-------------|---------------|
| Encryption in transit | TLS 1.2+ on all endpoints; no HTTP |
| Encryption at rest | Database encryption enabled (PostgreSQL `pgcrypto` or managed DB encryption) |
| Least privilege | Each service has its own DB credentials with only needed permissions |
| Secrets management | Environment variables, never hardcoded; use `.env` + secret manager in production |
| Backups | Daily DB backup to separate storage; retention 30 days |
| Dependency scanning | `npm audit` or `pip audit` in CI pipeline |
| OWASP Top 10 | Check against: SQL injection (parameterized queries), XSS (CSP headers), CSRF (SameSite cookies), broken auth (JWT best practices) |

---

## API Endpoints

```
POST /safety/check-content           -- Run content safety check on a text string (internal)
GET  /safety/flags?session_id=...    -- Get safety flags for a session (admin/mentor)
POST /safety/incident                -- Trigger incident response for high-severity flag
GET  /admin/audit-log                -- (from TASK-12, but implemented here)
POST /admin/data-export/:learner_id  -- Trigger GDPR-style data export
POST /admin/data-deletion/:learner_id -- Schedule data deletion
GET  /consent/:learner_id            -- Get consent status for a learner
POST /consent                        -- Record consent
DELETE /consent/:learner_id          -- Revoke consent (triggers data deletion process)
```

---

## Acceptance Criteria

- [ ] Content safety filter blocks responses containing external URLs
- [ ] Mental health signal keywords trigger mentor notification (test with: "I hate everything", "I want to give up")
- [ ] Row-level security prevents learner from accessing another learner's data
- [ ] Mentor can only see learners assigned to them (verified via mentor_assignments)
- [ ] No session can start for a learner without a consent record
- [ ] Every login, data access, and admin action creates an audit_log entry
- [ ] High-severity safety flag sends notification to mentor within 60 seconds
- [ ] Data export returns all data for a learner in structured JSON
- [ ] Consent can be revoked and triggers deletion scheduling
- [ ] All API endpoints use HTTPS (even in local dev with self-signed cert)

---

## Dependencies
- **TASK-03**: Auth (actor identification for audit log)
- **TASK-08**: AI Companion (content is filtered before delivery)
- **TASK-09**: Mentor Dashboard (receives safety notifications)
- **TASK-12**: Admin Panel (audit log viewer, data requests)
- All other tasks (audit log hooks must be added to every service)

---

## Notes for LLM Agent
- This task cross-cuts all other tasks — implement it early so other tasks can hook into it
- Create a shared `audit.service.ts` (or similar) that every other service imports to log actions
- The content safety filter should be easy to extend with new keyword lists
- Row-Level Security in PostgreSQL is the most reliable way to enforce tenant isolation at DB level
- Never log sensitive content (passwords, full AI prompts) to the audit log — log summaries only
- For distress keyword detection in MVP: use a simple keyword list (`['hate myself', 'want to hurt', 'give up', ...]`) — not ML-based
- Mark clearly in code which functions touch PII so future data minimisation reviews are easy

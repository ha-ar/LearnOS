# TASK-12: Admin Panel — Centre Operations & Configuration

## Overview
Build the **Admin Panel** — the web interface used by learning-centre administrators to manage users, devices, curriculum configuration, tenant settings, and view centre-level analytics. This is the operational backbone of the centre.

## Context (from LearnOS Product Document)
> "Admin controls" (listed as MVP deliverable in Learning Workspace)
> "Multi-tenant admin, curriculum configuration, provider connector framework, refined dashboards, implementation playbook" (Phase 3 – Productisation)
> For MVP (Phase 1), admin controls are basic: user management, device registration, and a simple overview dashboard.

---

## MVP Admin Features

### 1. User Management

#### Screens:
- **User List**: Table of all users in the tenant (learners, mentors, parents, admins)
- **Add User**: Form to create a new user
- **Edit User**: Update user details, activate/deactivate
- **Assign Learner to Mentor**: Link a learner to their primary mentor
- **Assign Parent to Learner**: Link guardian to learner + record consent

#### User List Table Columns:
| Name | Role | Grade | Mentor | Status | Last Active | Actions |
|------|------|-------|--------|--------|-------------|---------|
| Ahmed Khan | Learner | Grade 6 | Ms. Nadia | Active | Today | Edit \| Deactivate |
| Sara Malik | Learner | Grade 7 | Ms. Nadia | Active | Yesterday | Edit \| Deactivate |
| Ms. Nadia | Mentor | — | — | Active | Now | Edit |

---

### 2. Device Management

- List all registered devices at the centre
- Register a new device (generates device token for client install)
- Mark device as active/inactive
- View last-seen timestamp

```
Devices Table:
| Device Name | Status | Last Seen | Room | Device ID | Actions |
| Room 1 PC   | Online | 2 min ago | Rm 1 | dev-001  | Edit \| Deactivate |
| Room 2 PC   | Offline| 2 days ago| Rm 2 | dev-002  | Edit \| Deactivate |
```

---

### 3. Curriculum Configuration

For MVP: select and activate the curriculum that the centre uses.

- List available curricula (from seed data — Pakistan National Curriculum is pre-loaded)
- Activate a curriculum for the tenant
- Set which subjects are active for this centre (e.g., Maths + English only in Phase 1)
- Set grade range for the centre (e.g., Grades 6–8)

This configuration determines which competencies and resources are shown to learners at this centre.

---

### 4. Centre Overview Dashboard

A summary dashboard for the admin showing centre health:

```
┌─────────────────────────────────────────────────────┐
│ LearnOS Pilot Centre — Week of July 21, 2026        │
├────────────┬────────────┬────────────┬──────────────┤
│ Learners   │ Sessions   │ Escalations│ Avg. Mastery │
│ Active: 12 │ This week: │ Open: 2    │ Fractions:   │
│ Total: 15  │ 48 of 60   │ Resolved:8 │ 65%          │
│            │ planned    │            │              │
└────────────┴────────────┴────────────┴──────────────┘
```

Key metrics:
- Active learner count
- Sessions planned vs. attended (this week)
- Open escalations (from TASK-09)
- Device status (online/offline)
- At-risk learners (3+ missed sessions, or low mastery + low engagement)

---

### 5. Consent Management

- View consent status for each learner
- Record consent (checkbox + date) for learners whose consent hasn't been captured
- Data export: export learner data for a specific learner (GDPR-style — for when parent requests)
- Data deletion request: mark learner for scheduled data deletion

---

### 6. Audit Log Viewer (Read-Only)

Admin can view a filtered audit log:
- Filter by: user, event type, date range
- Shows: who did what, when, from which device
- Export as CSV

This is essential for safety and accountability.

---

## API Endpoints (Admin-Only, Requires admin JWT)

### User Management
```
GET    /admin/users                          -- List all users in tenant
POST   /admin/users                          -- Create user
GET    /admin/users/:id                      -- Get user detail
PATCH  /admin/users/:id                      -- Update user
DELETE /admin/users/:id                      -- Deactivate (soft delete)
POST   /admin/users/assign-mentor            -- { learner_id, mentor_id }
POST   /admin/users/assign-parent            -- { learner_id, parent_id, consent_given }
```

### Device Management
```
GET    /admin/devices                        -- List devices
POST   /admin/devices/register               -- Register device, returns device_token
PATCH  /admin/devices/:id                    -- Update device name/room
DELETE /admin/devices/:id                    -- Deactivate device
```

### Curriculum Configuration
```
GET    /admin/config/curricula               -- List available curricula
POST   /admin/config/curricula/activate      -- { curriculum_id, subjects: [], grade_min, grade_max }
GET    /admin/config/active                  -- Get current tenant config
```

### Overview Dashboard
```
GET    /admin/dashboard                      -- Centre overview metrics
GET    /admin/dashboard/at-risk-learners     -- Learners needing attention
```

### Consent & Data
```
GET    /admin/consent                        -- List all consent records
POST   /admin/consent/:learner_id            -- Record consent
POST   /admin/data-export/:learner_id        -- Trigger data export
POST   /admin/data-deletion/:learner_id      -- Schedule data deletion
```

### Audit Log
```
GET    /admin/audit-log?user_id=...&event_type=...&from=...&to=...
GET    /admin/audit-log/export?from=...&to=...      -- Returns CSV
```

---

## Database Schema (Additional Tables)

```sql
-- Tenant configuration
CREATE TABLE tenant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  active_curriculum_id UUID REFERENCES curricula(id),
  active_subjects TEXT[],              -- e.g., ['Mathematics', 'English']
  grade_min INT DEFAULT 6,
  grade_max INT DEFAULT 8,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Learner-Mentor assignment
CREATE TABLE learner_mentor_assignments (
  learner_id UUID NOT NULL REFERENCES users(id),
  mentor_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY (learner_id, mentor_id)
);

-- Data export / deletion requests
CREATE TABLE data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  requested_by UUID REFERENCES users(id),
  request_type VARCHAR(50) CHECK (request_type IN ('export', 'deletion')),
  status VARCHAR(50) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  file_url TEXT                        -- For export: where the file was stored
);
```

---

## Screens Summary

| Screen | URL | Role |
|--------|-----|------|
| Admin Dashboard | `/admin` | admin |
| User Management | `/admin/users` | admin |
| Add/Edit User | `/admin/users/new`, `/admin/users/:id` | admin |
| Device Management | `/admin/devices` | admin |
| Curriculum Config | `/admin/config` | admin |
| Consent Management | `/admin/consent` | admin |
| Audit Log | `/admin/audit` | admin |
| Data Requests | `/admin/data-requests` | admin |

---

## Mock Data (MVP Seed)

```json
{
  "tenant": {
    "id": "tenant-001",
    "name": "LearnOS Pilot Centre",
    "config": {
      "active_curriculum": "Pakistan National Curriculum 2006",
      "active_subjects": ["Mathematics"],
      "grade_min": 6,
      "grade_max": 8
    }
  },
  "user_summary": {
    "total_learners": 3,
    "total_mentors": 1,
    "total_parents": 1,
    "total_admins": 1
  },
  "devices": [
    { "id": "dev-001", "name": "Room 1 PC", "status": "online", "last_seen": "2026-07-22T09:45:00Z" },
    { "id": "dev-002", "name": "Room 2 PC", "status": "offline", "last_seen": "2026-07-20T16:30:00Z" }
  ]
}
```

---

## Acceptance Criteria

- [ ] User list shows all users in the tenant with correct role labels
- [ ] Create user form creates a new user and sends credentials (mock email for MVP)
- [ ] Learner can be assigned to a mentor via admin panel
- [ ] Device registration returns a device token that the client can use
- [ ] Curriculum configuration persists and affects session plan generation
- [ ] Overview dashboard shows correct session attendance count for current week
- [ ] At-risk learners list correctly identifies learners with 3+ missed sessions
- [ ] Consent record can be created with date and guardian name
- [ ] Audit log shows recent admin actions
- [ ] All admin endpoints reject requests from non-admin JWT

---

## Dependencies
- **TASK-03**: Auth (admin JWT)
- **TASK-04**: Digital Twin (learner data for dashboard)
- **TASK-05**: Core Services API (session data for dashboard metrics)
- **TASK-07**: Event Log (audit log data)
- **TASK-09**: Mentor Dashboard (escalation counts for dashboard)

---

## Notes for LLM Agent
- Admin panel is a React web app — separate from mentor dashboard and learner client
- Use a data table library (e.g., TanStack Table / React Table) for user and device lists
- Soft delete only — never hard delete user records in MVP (mark as `is_active = false`)
- All admin actions must be logged to the audit log
- Device token must be a cryptographically secure random string (256 bits)
- The "at-risk learners" query: learners where sessions_attended < sessions_planned * 0.6 in last 2 weeks

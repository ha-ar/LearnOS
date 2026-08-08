# TASK-05: Core Services API — Session Plan, Learning Plan & Notifications

## Overview
Build the **Core Services API** — the backend REST API that powers session planning, learning plan management, notifications, and reports. This is the central orchestration service that coordinates between the Digital Twin, Recommendation Engine, Resource Layer, and all clients.

## Context (from LearnOS Product Document)
> "Core services: Learning plan, competencies, sessions, portfolio, notifications, reports"
> "The permanent question in the system is: 'What is the next best learning action for this learner, now?'"

---

## MVP Features to Build

### 1. Session Management

A **session** is one complete learner sitting (e.g., a 45-minute learning block at the centre).

#### Session Lifecycle:
```
create_session → start_session → [tasks completed] → end_session
```

#### Endpoints:
```
POST   /sessions                    -- Create a new session for a learner (admin/system)
GET    /sessions/:session_id        -- Get session details
POST   /sessions/:session_id/start  -- Mark session as started (learner)
POST   /sessions/:session_id/end    -- End session, trigger reflection + report generation
GET    /sessions?learner_id=...     -- List sessions for a learner (mentor/admin)
GET    /sessions/:session_id/events -- Get all events for a session
```

#### Session Schema:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  mentor_id UUID REFERENCES users(id),
  device_id UUID REFERENCES devices(id),
  planned_at DATE NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'planned'
    CHECK (status IN ('planned','active','completed','abandoned')),
  session_goal TEXT,
  total_duration_min INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. Session Task Plan

A session consists of ordered **tasks**. Each task is one learning activity.

#### Task Types:
| Type | Description |
|------|-------------|
| `review` | Revisit a previously studied topic |
| `learn` | Engage with a new resource (video, article, etc.) |
| `practice` | Complete check questions or exercises |
| `reflect` | End-of-session reflection prompt |
| `mentor_check` | Planned mentor interaction |

#### Schema:
```sql
CREATE TABLE session_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  task_order INT NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  competency_id UUID REFERENCES competencies(id),
  resource_id UUID REFERENCES resources(id),
  duration_min INT,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending','active','completed','skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

#### Task Endpoints:
```
GET  /sessions/:session_id/tasks              -- Get ordered task list
POST /sessions/:session_id/tasks/:id/start   -- Mark task as started
POST /sessions/:session_id/tasks/:id/complete -- Mark task as completed
POST /sessions/:session_id/tasks/:id/skip    -- Skip task (mentor override only)
```

---

### 3. Learning Plan (Curriculum Map)

A **Learning Plan** is the long-term curriculum path for a learner: what they should learn this week, this month, this term.

```sql
CREATE TABLE learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  curriculum_id UUID NOT NULL,
  term_label VARCHAR(100),           -- e.g., "Term 1 2026"
  subject VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES learning_plans(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  sequence_order INT,
  target_mastery_level VARCHAR(50) DEFAULT 'proficient',
  target_completion_date DATE,
  status VARCHAR(50) DEFAULT 'not_started'
);
```

#### Endpoints:
```
GET  /learning-plans/:learner_id         -- Get active learning plan
POST /learning-plans                     -- Create plan (admin/mentor)
PATCH /learning-plans/:id                -- Update plan
GET  /learning-plans/:id/progress        -- Get progress summary
```

---

### 4. Curriculum Catalogue (MVP: static seed data)

```sql
CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,          -- e.g., "Pakistan National Curriculum 2006"
  country VARCHAR(100),
  description TEXT
);
```

MVP: Seed with one curriculum (Pakistan National Curriculum) and a set of Mathematics competencies for Grades 6–8.

---

### 5. Notification System (MVP: basic)

Used for:
- Mentor escalation alerts ("Ahmed needs help — escalated by AI Companion")
- Weekly parent report ready notifications
- Session reminders

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id),
  sender_id UUID,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

```
GET  /notifications?user_id=...        -- Get unread notifications for user
POST /notifications/:id/read           -- Mark as read
POST /notifications                    -- Create (internal/system use only)
```

---

### 6. Session Plan Generation (MVP: Rule-Based)

The session plan is generated by a rule-based algorithm (not ML) at the start of each day.

**Algorithm (MVP):**
1. Get learner's active learning plan items
2. For each item, check mastery state from Digital Twin
3. Prioritise: items with `review_due_at` ≤ today first (spaced repetition)
4. Then: next unstarted `learning_plan_item` in sequence
5. Limit to 3–4 tasks per session (to fit 40–50 minutes)
6. Assign resources from resource catalogue (matching competency + grade + format preference)
7. Always end with a `reflect` task

```
POST /sessions/generate-plan/:learner_id  -- Generate today's session (internal/admin)
```

---

## Mock Data for MVP

```json
{
  "sessions": [
    {
      "id": "session-mock-001",
      "learner_id": "learner-001",
      "planned_at": "2026-07-22",
      "status": "active",
      "session_goal": "Review fractions; learn equivalent fractions; practise; reflect.",
      "tasks": [
        { "id": "t1", "task_order": 1, "task_type": "review", "title": "Quick Review: Basic Fractions", "duration_min": 10, "status": "completed" },
        { "id": "t2", "task_order": 2, "task_type": "learn", "title": "Equivalent Fractions – Video Lesson", "resource_id": "res-001", "duration_min": 15, "status": "active" },
        { "id": "t3", "task_order": 3, "task_type": "practice", "title": "Practice: 5 Questions", "resource_id": "res-002", "duration_min": 10, "status": "pending" },
        { "id": "t4", "task_order": 4, "task_type": "reflect", "title": "Session Reflection", "duration_min": 5, "status": "pending" }
      ]
    }
  ]
}
```

---

## API Design Rules

- All responses use consistent envelope:
```json
{
  "data": { ... },
  "meta": { "timestamp": "...", "request_id": "..." }
}
```
- All errors use:
```json
{
  "error": "session_not_found",
  "message": "No session found with ID xyz",
  "code": 404
}
```
- All list endpoints support: `?limit=20&offset=0&order=created_at:desc`
- All write endpoints are idempotent where possible

---

## Acceptance Criteria

- [ ] `POST /sessions` creates a session with tasks for a learner
- [ ] `GET /sessions/:id/tasks` returns ordered task list
- [ ] Tasks can be marked started and completed via PATCH/POST endpoints
- [ ] `GET /learning-plans/:learner_id` returns current plan with progress
- [ ] Notification can be created and listed for a user
- [ ] Session plan generation rule produces a sensible 4-task plan from mock Twin data
- [ ] All endpoints return correct HTTP status codes
- [ ] All endpoints require valid JWT (from TASK-03)

---

## Dependencies
- **TASK-03**: Auth middleware
- **TASK-04**: Digital Twin (read mastery state for plan generation)
- **TASK-06**: Resource Intelligence Layer (assign resources to tasks)
- **TASK-11**: Recommendation Engine (feeds into plan generation)
- **TASK-09**: Mentor Dashboard (reads sessions)
- **TASK-10**: Parent Report (reads sessions + progress)

---

## Notes for LLM Agent
- Use PostgreSQL for all persistent data
- Expose via REST (JSON) — no GraphQL in MVP
- Session plan generation can be a simple function with hardcoded rules — no ML
- Mock data should be seeded via a migration script, not hardcoded in code
- Add OpenAPI/Swagger docs for all endpoints
- Keep services modular: `session.service.ts`, `plan.service.ts`, `notification.service.ts`

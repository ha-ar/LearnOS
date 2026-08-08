# TASK-14: Database Schema, Migrations & Mock Data Seed

## Overview
Set up the **complete database schema** for LearnOS MVP, all migration files, and a comprehensive mock data seed that enables every other task to run with realistic data without needing a real production database. This task is a **prerequisite** for all other backend tasks and should be completed first.

## Context
The LearnOS MVP uses **PostgreSQL** as the primary data store, as specified in the product document:
> "PostgreSQL + object store; event/event-log design; graph capability only when justified"

All schemas from TASK-03 through TASK-13 must be consolidated here into a clean, ordered set of migrations.

---

## Database Technology Stack

- **Database**: PostgreSQL 15+
- **Migration tool**: Flyway or database-native SQL migration files (numbered: `V001__init.sql`, `V002__users.sql`, etc.)
- **ORM (optional)**: Prisma (Node.js) or SQLAlchemy (Python) — or raw SQL with parameterized queries
- **Local development**: Docker Compose with PostgreSQL image
- **Connection pool**: PgBouncer or built-in pool (connection limit: 20 for MVP)

---

## Migration Order

All migrations must run in this exact order:

```
V001__create_extensions.sql          -- pgcrypto, uuid-ossp
V002__create_tenants.sql             -- Tenants table
V003__create_users.sql               -- Users + learner_profiles
V004__create_devices.sql             -- Device registration
V005__create_auth_tokens.sql         -- Refresh tokens
V006__create_curricula.sql           -- Curricula catalogue
V007__create_competencies.sql        -- Competency tree
V008__create_digital_twin.sql        -- Twin tables (competency states, learning profile, goals, portfolio)
V009__create_resources.sql           -- Resource catalogue
V010__create_resource_maps.sql       -- Resource ↔ competency mappings
V011__create_sessions.sql            -- Sessions + tasks
V012__create_learning_plans.sql      -- Learning plans
V013__create_session_events.sql      -- Event log
V014__create_ai_interactions.sql     -- AI Companion log
V015__create_escalations.sql         -- Escalation records
V016__create_notifications.sql       -- Notification queue
V017__create_weekly_reports.sql      -- Parent reports
V018__create_consent.sql             -- Consent records
V019__create_safety.sql              -- Safety flags
V020__create_audit_log.sql           -- Audit log
V021__create_recommendation_log.sql  -- Recommendation + evidence audit
V022__create_tenant_config.sql       -- Tenant settings
V023__create_mentor_notes.sql        -- Mentor notes
V024__create_indexes.sql             -- All performance indexes
```

---

## Complete Consolidated Schema (All Tables)

### Foundational

```sql
-- V001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- V002
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'learning_centre',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- V003
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('learner','mentor','parent','admin','superadmin')),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learner_profiles (
  learner_id UUID PRIMARY KEY REFERENCES users(id),
  guardian_id UUID REFERENCES users(id),
  grade VARCHAR(50),
  curriculum_id UUID,
  date_of_birth DATE,
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ
);

-- V004
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  device_token VARCHAR(512) UNIQUE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- V005
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(512) UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
```

### Curriculum

```sql
-- V006
CREATE TABLE curricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- V007
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL REFERENCES curricula(id),
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  subtopic VARCHAR(255),
  grade_level VARCHAR(50),
  prerequisite_ids UUID[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Digital Twin

```sql
-- V008
CREATE TABLE learner_competency_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  mastery_level VARCHAR(50) DEFAULT 'not_started'
    CHECK (mastery_level IN ('not_started','emerging','developing','proficient','mastered')),
  mastery_score NUMERIC(4,2),
  attempts_total INT DEFAULT 0,
  attempts_correct INT DEFAULT 0,
  learner_confidence INT,
  last_practiced_at TIMESTAMPTZ,
  review_due_at TIMESTAMPTZ,
  evidence_summary TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, competency_id)
);

CREATE TABLE learner_profiles_twin (
  learner_id UUID PRIMARY KEY REFERENCES users(id),
  preferred_format VARCHAR(100),
  preferred_session_length_min INT,
  hint_response VARCHAR(50),
  pace_signal VARCHAR(50),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  goal_type VARCHAR(50),
  description TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  item_type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  file_url TEXT,
  competency_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Resources

```sql
-- V009
CREATE TABLE resource_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  base_url TEXT,
  attribution_text TEXT,
  terms_url TEXT,
  is_active BOOLEAN DEFAULT true,
  age_min INT DEFAULT 5,
  age_max INT DEFAULT 18,
  integration_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES resource_providers(id),
  external_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  format VARCHAR(100) NOT NULL,
  url TEXT,
  embed_url TEXT,
  duration_min INT,
  grade_min INT,
  grade_max INT,
  language VARCHAR(50) DEFAULT 'en',
  is_age_safe BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  attribution TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- V010
CREATE TABLE resource_competency_map (
  resource_id UUID NOT NULL REFERENCES resources(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  fit_type VARCHAR(50) DEFAULT 'primary',
  PRIMARY KEY (resource_id, competency_id)
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  competency_id UUID REFERENCES competencies(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer VARCHAR(10),
  explanation TEXT,
  difficulty VARCHAR(50) DEFAULT 'medium',
  grade_level INT
);
```

### Sessions

```sql
-- V011
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

CREATE TABLE session_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  task_order INT NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  competency_id UUID REFERENCES competencies(id),
  resource_id UUID REFERENCES resources(id),
  duration_min INT,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- V012
CREATE TABLE learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  curriculum_id UUID NOT NULL REFERENCES curricula(id),
  term_label VARCHAR(100),
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

---

## Complete Mock Data Seed Script

File: `seed/seed_mvp.sql`

```sql
-- ============================================================
-- LearnOS MVP Seed Data
-- ============================================================

-- Tenant
INSERT INTO tenants (id, name, type) VALUES
('00000000-0000-0000-0000-000000000001', 'LearnOS Pilot Centre', 'learning_centre');

-- Users (passwords: all 'LearnOS2026!' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES
('10000000-0000-0000-0000-000000000001', 'ahmed@pilot.learnos', '$2b$12$...', 'Ahmed Khan', 'learner', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000002', 'sara@pilot.learnos', '$2b$12$...', 'Sara Malik', 'learner', '00000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', 'omar@pilot.learnos', '$2b$12$...', 'Omar Farooq', 'learner', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001', 'mentor@pilot.learnos', '$2b$12$...', 'Ms. Nadia', 'mentor', '00000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000001', 'parent1@pilot.learnos', '$2b$12$...', 'Mr. Khan Sr.', 'parent', '00000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000001', 'admin@pilot.learnos', '$2b$12$...', 'Admin User', 'admin', '00000000-0000-0000-0000-000000000001');

-- Learner Profiles
INSERT INTO learner_profiles (learner_id, guardian_id, grade, curriculum_id, consent_given, consent_given_at) VALUES
('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Grade 6', 'curr-001', true, NOW()),
('10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Grade 7', 'curr-001', true, NOW()),
('10000000-0000-0000-0000-000000000003', NULL, 'Grade 8', 'curr-001', false, NULL);

-- Curriculum
INSERT INTO curricula (id, name, country) VALUES
('curr-001', 'Pakistan National Curriculum 2006', 'Pakistan');

-- Competencies (Mathematics, Grade 6)
INSERT INTO competencies (id, curriculum_id, subject, topic, grade_level, prerequisite_ids, description) VALUES
('comp-001', 'curr-001', 'Mathematics', 'Basic Fractions', 'Grade 6', '{}', 'Understanding halves, quarters and thirds; representing fractions on a number line'),
('comp-002', 'curr-001', 'Mathematics', 'Equivalent Fractions', 'Grade 6', '{"comp-001"}', 'Finding and verifying equivalent fractions; simplifying fractions'),
('comp-003', 'curr-001', 'Mathematics', 'Adding Fractions (Same Denominator)', 'Grade 6', '{"comp-001", "comp-002"}', 'Adding fractions with the same denominator; word problems'),
('comp-004', 'curr-001', 'Mathematics', 'Adding Fractions (Different Denominator)', 'Grade 7', '{"comp-003"}', 'Finding common denominators; adding unlike fractions'),
('comp-005', 'curr-001', 'Mathematics', 'Multiplying Fractions', 'Grade 7', '{"comp-002", "comp-003"}', 'Multiplying fractions and mixed numbers');

-- Learner Twin: Competency States for Ahmed (learner-001)
INSERT INTO learner_competency_states 
  (learner_id, competency_id, mastery_level, mastery_score, attempts_total, attempts_correct, learner_confidence, last_practiced_at, review_due_at, evidence_summary)
VALUES
('10000000-0000-0000-0000-000000000001', 'comp-001', 'proficient', 0.78, 12, 9, 4, NOW() - INTERVAL '3 days', NOW() + INTERVAL '11 days', '9 of 12 check questions correct across 3 sessions. Mentor note: strong with halves and quarters; struggles slightly with thirds.'),
('10000000-0000-0000-0000-000000000001', 'comp-002', 'emerging', 0.33, 3, 1, 2, NOW(), NOW() + INTERVAL '2 days', 'First session today. 1 of 3 correct. AI Companion triggered twice. Mentor escalation pending.');

-- Learner Twin Profile
INSERT INTO learner_profiles_twin (learner_id, preferred_format, preferred_session_length_min, hint_response, pace_signal) VALUES
('10000000-0000-0000-0000-000000000001', 'video', 40, 'benefits_from_hints', 'average');

-- Resource Providers
INSERT INTO resource_providers (id, name, type, base_url, attribution_text) VALUES
('prov-001', 'Khan Academy', 'deep_link', 'https://www.khanacademy.org', 'Content by Khan Academy (CC BY-NC-SA 3.0)'),
('prov-002', 'LearnOS Internal', 'internal', NULL, 'LearnOS Learning Content');

-- Resources
INSERT INTO resources (id, provider_id, title, format, url, duration_min, grade_min, grade_max, description) VALUES
('res-001', 'prov-001', 'Equivalent Fractions – Khan Academy Video', 'video', 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic/arith-review-equivalent-fractions/v/equivalent-fractions', 8, 5, 7, 'Video explanation of equivalent fractions using visual models'),
('res-002', 'prov-002', 'Equivalent Fractions – Practice Quiz (5 Questions)', 'internal_quiz', NULL, 10, 5, 7, 'Five multiple-choice questions testing equivalent fraction identification'),
('res-003', 'prov-002', 'Basic Fractions – Quick Review Article', 'article', NULL, 5, 4, 6, 'Text-based review of basic fraction concepts'),
('res-004', 'prov-002', 'Equivalent Fractions – Worked Example', 'article', NULL, 7, 5, 7, 'Step-by-step worked example using the cross-multiplication method'),
('res-005', 'prov-001', 'Basic Fractions – Khan Academy Video', 'video', 'https://www.khanacademy.org/math/arithmetic-home/fractions', 10, 4, 6, 'Introduction to fractions with visual demonstrations');

-- Resource ↔ Competency Map
INSERT INTO resource_competency_map (resource_id, competency_id, fit_type) VALUES
('res-001', 'comp-002', 'primary'),
('res-002', 'comp-002', 'primary'),
('res-003', 'comp-001', 'primary'),
('res-004', 'comp-002', 'supplementary'),
('res-005', 'comp-001', 'primary');

-- Quiz Questions for res-002
INSERT INTO quiz_questions (id, resource_id, competency_id, question_text, question_type, options, correct_answer, explanation, difficulty) VALUES
('q-001', 'res-002', 'comp-002', 'Which fraction is equivalent to 1/2?', 'multiple_choice', '[{"key":"a","text":"2/3"},{"key":"b","text":"2/4"},{"key":"c","text":"3/4"},{"key":"d","text":"4/5"}]', 'b', '1/2 = 2/4 because we multiply both top and bottom by 2. Try it: 1×2=2, 2×2=4.', 'easy'),
('q-002', 'res-002', 'comp-002', 'Which fraction is equivalent to 2/3?', 'multiple_choice', '[{"key":"a","text":"4/6"},{"key":"b","text":"3/5"},{"key":"c","text":"4/5"},{"key":"d","text":"6/8"}]', 'a', '2/3 = 4/6 because 2×2=4 and 3×2=6. Both top and bottom multiplied by 2.', 'easy'),
('q-003', 'res-002', 'comp-002', 'Simplify 6/8 to its simplest form.', 'multiple_choice', '[{"key":"a","text":"2/3"},{"key":"b","text":"3/4"},{"key":"c","text":"4/6"},{"key":"d","text":"3/5"}]', 'b', '6 and 8 share a common factor of 2. 6÷2=3, 8÷2=4. So 6/8 = 3/4.', 'medium');

-- Session (today's session for Ahmed)
INSERT INTO sessions (id, learner_id, tenant_id, mentor_id, planned_at, started_at, status, session_goal) VALUES
('sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, NOW() - INTERVAL '25 minutes', 'active', 'Review fractions; learn equivalent fractions; practise; reflect.');

-- Session Tasks
INSERT INTO session_tasks (id, session_id, task_order, task_type, title, competency_id, resource_id, duration_min, status, started_at, completed_at) VALUES
('task-001', 'sess-001', 1, 'review', 'Quick Review: Basic Fractions', 'comp-001', 'res-003', 10, 'completed', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '15 minutes'),
('task-002', 'sess-001', 2, 'learn', 'Equivalent Fractions – Video Lesson', 'comp-002', 'res-001', 15, 'active', NOW() - INTERVAL '14 minutes', NULL),
('task-003', 'sess-001', 3, 'practice', 'Practice: 5 Questions', 'comp-002', 'res-002', 10, 'pending', NULL, NULL),
('task-004', 'sess-001', 4, 'reflect', 'Session Reflection', NULL, NULL, 5, 'pending', NULL, NULL);

-- Session Events (sample events for sess-001)
INSERT INTO session_events (event_type, session_id, learner_id, tenant_id, resource_id, competency_id, task_id, payload, timestamp) VALUES
('session_started', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, '{"device_id":"dev-001"}', NOW() - INTERVAL '25 minutes'),
('task_started', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'comp-001', 'task-001', '{}', NOW() - INTERVAL '25 minutes'),
('resource_opened', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-003', 'comp-001', 'task-001', '{"title":"Basic Fractions – Quick Review Article"}', NOW() - INTERVAL '24 minutes'),
('resource_completed', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-003', 'comp-001', 'task-001', '{"time_spent_sec":480}', NOW() - INTERVAL '16 minutes'),
('task_completed', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'comp-001', 'task-001', '{}', NOW() - INTERVAL '15 minutes'),
('task_started', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', NULL, 'comp-002', 'task-002', '{}', NOW() - INTERVAL '14 minutes'),
('resource_opened', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-001', 'comp-002', 'task-002', '{"title":"Equivalent Fractions – Khan Academy Video"}', NOW() - INTERVAL '13 minutes'),
('video_paused', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-001', 'comp-002', 'task-002', '{"timestamp_sec":222,"reason":"learner_paused"}', NOW() - INTERVAL '10 minutes'),
('hint_requested', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-001', 'comp-002', 'task-002', '{}', NOW() - INTERVAL '9 minutes'),
('ai_question_asked', 'sess-001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'res-001', 'comp-002', 'task-002', '{"question":"Why did she divide by two?","mode":"free_question"}', NOW() - INTERVAL '8 minutes');

-- Devices
INSERT INTO devices (id, name, tenant_id, device_token, last_seen_at) VALUES
('dev-001', 'Room 1 PC', '00000000-0000-0000-0000-000000000001', 'mock-device-token-room1-secure-string-abc123', NOW()),
('dev-002', 'Room 2 PC', '00000000-0000-0000-0000-000000000001', 'mock-device-token-room2-secure-string-xyz789', NOW() - INTERVAL '2 days');

-- Consent Records
INSERT INTO consent_records (learner_id, guardian_id, consent_version, data_scope, consent_method, consented_at) VALUES
('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'v1.0', ARRAY['session_events', 'twin', 'reports', 'ai_interactions'], 'admin_recorded', NOW() - INTERVAL '7 days'),
('10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'v1.0', ARRAY['session_events', 'twin', 'reports', 'ai_interactions'], 'admin_recorded', NOW() - INTERVAL '7 days');

-- Escalation (for Sara, learner-002)
INSERT INTO sessions (id, learner_id, tenant_id, mentor_id, planned_at, started_at, status) VALUES
('sess-002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', CURRENT_DATE, NOW() - INTERVAL '35 minutes', 'active');

INSERT INTO escalations (id, session_id, learner_id, tenant_id, trigger_type, competency_id, brief_text, evidence_snapshot, ai_suggested_approach, status) VALUES
('esc-001', 'sess-002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ai_suggested', 'comp-001', 'Sara has answered 3 of 5 check questions incorrectly on Basic Fractions and clicked "I''m stuck" twice. Two AI explanations were tried. The concept may require hands-on intervention.', '{"incorrect_answers":3,"hints_requested":2,"ai_explanations_given":2,"time_stuck_min":12}', 'Try a worked example using physical objects or drawing fractions on paper.', 'pending');
```

---

## Docker Compose Setup

File: `docker-compose.dev.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: learnos_dev
      POSTGRES_USER: learnos
      POSTGRES_PASSWORD: learnos_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

volumes:
  postgres_data:
```

---

## Acceptance Criteria

- [ ] All 24 migration files run in order without errors on a fresh PostgreSQL instance
- [ ] `docker-compose up` brings up a working PostgreSQL with all tables created
- [ ] Seed script inserts all mock data without foreign key violations
- [ ] 3 learners, 1 mentor, 1 parent, 1 admin created with correct roles
- [ ] 5 competencies created with correct prerequisite relationships
- [ ] 5 resources created and mapped to competencies
- [ ] 3 quiz questions seeded for res-002
- [ ] 1 active session with 4 tasks and 10+ events seeded for learner-001
- [ ] 1 pending escalation seeded for learner-002
- [ ] Consent records created for learner-001 and learner-002
- [ ] All foreign key constraints validated (no orphan records)

---

## Dependencies
This task is a **prerequisite** for:
- TASK-03 (Auth service)
- TASK-04 (Digital Twin)
- TASK-05 (Core Services)
- TASK-06 (Resource Layer)
- TASK-07 (Event Log)
- TASK-08 (AI Companion)
- TASK-09 (Mentor Dashboard)
- TASK-10 (Parent Report)
- TASK-11 (Evidence Engine)
- TASK-12 (Admin Panel)
- TASK-13 (Safety/Governance)

---

## Notes for LLM Agent
- Run migrations in strict numeric order — use a migration runner or number-ordered files
- Bcrypt hash all passwords in seed script — never store plaintext passwords even in dev
- Use deterministic UUIDs in seed data (as shown above) for easier cross-service testing
- Create a `seed/reset.sql` that drops and recreates all data for fast local test resets
- All tables must have `created_at` with `DEFAULT NOW()`
- Use `TIMESTAMPTZ` (with timezone) for all timestamps — never plain `TIMESTAMP`
- Test seed script on fresh DB before finalising — common issue: wrong insertion order violating FK constraints

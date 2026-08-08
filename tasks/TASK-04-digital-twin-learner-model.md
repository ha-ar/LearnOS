# TASK-04: Digital Twin — Learner Model Data Store

## Overview
Build the **Digital Twin** — the continuously-evolving, evidence-backed data model of each learner. The Digital Twin stores competency states, session history, learning preferences, goals, and portfolio items. It is the "source of truth" for who a learner is academically and what they need next.

## Context (from LearnOS Product Document)
> "The Digital Twin is a continuously evolving, evidence-backed representation of a learner. It is not a personality label and should not become a surveillance warehouse. Its purpose is practical: help the learner, mentor and parent make better learning decisions."

**EVIDENCE STANDARD:** Every meaningful learner conclusion should be traceable. "Needs a fractions review" should link to relevant attempts, response patterns, confidence and prerequisite dependency — not an opaque score.

---

## MVP Scope (Deliberately Small)

The MVP Digital Twin must remain small and auditable. Only collect:
- Subjects and topics
- Mastery estimate (per topic)
- Confidence prompt (learner-reported)
- Attempts (count and pattern)
- Time spent per topic
- Resource history (which resources were used)
- Questions asked (to AI Companion)
- Mentor notes

**Do NOT add in MVP:**
- Hundreds of behavioural, wellness or personality variables
- Biometric or ambient surveillance data
- Opaque predictive scores
- Social graph data

---

## Twin Domains (MVP)

| Domain | Examples of Data | Decision It Supports |
|--------|-----------------|---------------------|
| **Identity & Permissions** | Student, guardian consent, curriculum, language, role | What data and experiences are appropriate? |
| **Competencies** | Topic mastery, prerequisites, attempts, confidence, retention review date | What should be learned or reviewed next? |
| **Learning Profile** | Preferred formats, pace signals, response to hints | How should the next activity be presented? |
| **Session Evidence** | Actions, answers, resource use, timestamps, mentor notes | What evidence supports the current view? |
| **Goals & Interests** | Academic objectives, interests, projects | Which projects or enrichment are relevant? |
| **Portfolio** | Projects, presentations, reflections, certificates | What capability can the learner demonstrate? |

---

## Database Schema

```sql
-- Competency Catalogue (shared, not per-learner)
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID NOT NULL,
  subject VARCHAR(100) NOT NULL,      -- e.g., "Mathematics"
  topic VARCHAR(255) NOT NULL,         -- e.g., "Equivalent Fractions"
  subtopic VARCHAR(255),               -- e.g., "Cross-multiplication method"
  grade_level VARCHAR(50),             -- e.g., "Grade 6"
  prerequisite_ids UUID[],             -- Array of competency IDs that must be mastered first
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learner Competency State (core Twin data)
CREATE TABLE learner_competency_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  mastery_level VARCHAR(50) DEFAULT 'not_started'
    CHECK (mastery_level IN ('not_started','emerging','developing','proficient','mastered')),
  mastery_score NUMERIC(4,2),          -- 0.00–1.00 (confidence-weighted estimate)
  attempts_total INT DEFAULT 0,
  attempts_correct INT DEFAULT 0,
  learner_confidence INT,              -- 1–5, self-reported
  last_practiced_at TIMESTAMPTZ,
  review_due_at TIMESTAMPTZ,           -- Spaced repetition scheduling
  evidence_summary TEXT,               -- Human-readable: why this mastery level
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(learner_id, competency_id)
);

-- Learning Profile (per learner)
CREATE TABLE learner_profiles_twin (
  learner_id UUID PRIMARY KEY REFERENCES users(id),
  preferred_format VARCHAR(100),       -- 'video', 'text', 'interactive', 'mixed'
  preferred_session_length_min INT,    -- Preferred session duration
  hint_response VARCHAR(50),           -- 'benefits_from_hints', 'prefers_direct', 'variable'
  pace_signal VARCHAR(50),             -- 'fast', 'average', 'needs_more_time'
  notes TEXT,                          -- Free text from mentor observations
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Evidence Log
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,    -- See Event Types below
  competency_id UUID REFERENCES competencies(id),
  resource_id UUID,                    -- Which resource was active
  payload JSONB,                       -- Flexible event-specific data
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE learner_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  goal_type VARCHAR(50),               -- 'academic', 'exam', 'skill', 'project'
  description TEXT NOT NULL,
  target_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  item_type VARCHAR(50),               -- 'project', 'reflection', 'certificate', 'presentation'
  title VARCHAR(255),
  description TEXT,
  file_url TEXT,
  competency_ids UUID[],               -- Which competencies this demonstrates
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Notes (linked to Twin)
CREATE TABLE mentor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  mentor_id UUID NOT NULL REFERENCES users(id),
  session_id UUID,
  note TEXT NOT NULL,
  note_type VARCHAR(50),               -- 'observation', 'escalation', 'praise', 'concern'
  competency_id UUID REFERENCES competencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Session Event Types

All events stored in `session_events.event_type`:

| Event Type | Description | Weight / Use |
|-----------|-------------|-------------|
| `session_started` | Learner begins a session | Operational |
| `session_ended` | Session completed or timed out | Operational |
| `resource_opened` | Resource loaded in player | Engagement signal |
| `resource_completed` | Learner finished resource | Exposure evidence |
| `video_paused` | Learner paused video (with timestamp) | Engagement signal |
| `hint_requested` | Learner clicked "I'm stuck" | Difficulty signal |
| `ai_question_asked` | Question sent to AI Companion | Learning behaviour |
| `check_question_answered` | Short diagnostic question answered | Primary evidence |
| `check_question_correct` | Correct answer on check | Capability evidence |
| `check_question_incorrect` | Incorrect answer on check | Gap signal |
| `mentor_escalated` | Escalation triggered | Support needed signal |
| `reflection_submitted` | End-of-session reflection | Metacognitive signal |
| `confidence_reported` | Learner rated confidence | Self-assessment |
| `resource_retry` | Learner retried a resource | Persistence / difficulty |

---

## API Endpoints

### Twin Read (Learner, Mentor, Admin)
```
GET /twin/:learner_id
GET /twin/:learner_id/competencies
GET /twin/:learner_id/competencies/:competency_id
GET /twin/:learner_id/session-events?session_id=...&limit=50
GET /twin/:learner_id/goals
GET /twin/:learner_id/portfolio
GET /twin/:learner_id/mentor-notes
```

### Twin Write (System / Internal)
```
POST /twin/:learner_id/events           -- Emit a session event
PATCH /twin/:learner_id/competencies/:id -- Update mastery state
POST /twin/:learner_id/goals
POST /twin/:learner_id/portfolio
POST /twin/:learner_id/mentor-notes     -- Mentor writes a note
```

---

## Mock Data (MVP Seed)

```json
{
  "learner_id": "learner-001",
  "competencies": [
    {
      "competency_id": "comp-fractions-basic",
      "topic": "Basic Fractions",
      "subject": "Mathematics",
      "mastery_level": "proficient",
      "mastery_score": 0.78,
      "attempts_total": 12,
      "attempts_correct": 9,
      "learner_confidence": 4,
      "evidence_summary": "9 of 12 check questions correct across 3 sessions. Mentor note: understands half/quarter, struggles with unlike denominators."
    },
    {
      "competency_id": "comp-fractions-equivalent",
      "topic": "Equivalent Fractions",
      "subject": "Mathematics",
      "mastery_level": "emerging",
      "mastery_score": 0.3,
      "attempts_total": 3,
      "attempts_correct": 1,
      "learner_confidence": 2,
      "evidence_summary": "First session today. 1/3 correct. AI Companion triggered twice. Mentor escalation pending."
    }
  ],
  "learning_profile": {
    "preferred_format": "video",
    "preferred_session_length_min": 40,
    "hint_response": "benefits_from_hints",
    "pace_signal": "average"
  }
}
```

---

## Acceptance Criteria

- [ ] `GET /twin/:learner_id` returns full twin summary (competencies, profile, recent events)
- [ ] `POST /twin/:learner_id/events` stores a session event with correct payload
- [ ] `PATCH /twin/:learner_id/competencies/:id` updates mastery level
- [ ] Evidence summary is human-readable and links to specific events (not an opaque score)
- [ ] All endpoints are protected by JWT auth middleware
- [ ] Learner can only read their own twin; mentor can read assigned learners
- [ ] Mock seed data loads correctly and is queryable

---

## Evidence Principle (Critical)

> Every meaningful learner conclusion should be traceable. "Needs a fractions review" should link to relevant attempts, response patterns, confidence and prerequisite dependency — not an opaque score.

Implementation requirement:
- `evidence_summary` field must be auto-generated from linked events (in MVP: can be a simple concatenation of recent evidence)
- Never store only a score; always store the events that generated it

---

## Dependencies
- **TASK-03**: Auth service (JWT, role check)
- **TASK-05**: Core Services API (session plan depends on Twin)
- **TASK-10**: Evidence Engine (writes to Twin events)
- **TASK-11**: Recommendation Engine (reads Twin to recommend next action)
- **TASK-09**: Mentor Dashboard (reads Twin for mentor context)

---

## Notes for LLM Agent
- PostgreSQL is the primary data store; use JSONB for flexible event payloads
- `learner_competency_states` is the most important table — get the schema right
- Do NOT add ML or probabilistic mastery models in MVP; use simple ratio (correct/total) with a cap
- `review_due_at` can be calculated as: `last_practiced_at + interval '7 days'` initially
- All writes to the Twin must be logged (who wrote, when, why)
- `prerequisite_ids` in competencies enables the diagnostic engine (TASK-11) to detect gaps

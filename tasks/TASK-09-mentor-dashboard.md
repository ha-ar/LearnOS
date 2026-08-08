# TASK-09: Mentor Dashboard — Coach Workflow & Escalation Queue

## Overview
Build the **Mentor Dashboard** — the web interface used by learning-centre coaches (mentors) to monitor their assigned learners, review escalations, take intervention actions, add notes, and track session progress. This is the human-in-the-loop control centre of LearnOS.

## Context (from LearnOS Product Document)
> "Human Operations: Coordinates coach and parent participation. Escalation queue, mentor briefings, parent reports, admin controls."
> "The AI Learning Companion summarises the session and prepares a structured escalation brief for a mentor."
> "Prioritised escalation queue with diagnosis summary"

The mentor dashboard is how LearnOS proves that AI is a **mentor multiplier**, not a replacement. Every escalation must be acted on by a human.

---

## Core Screens to Build

### 1. Mentor Home / Overview Dashboard

**URL:** `/mentor/dashboard`

Shows at-a-glance status of the current session for all assigned learners:

| Learner | Status | Current Task | Escalation | Time in Session |
|---------|--------|-------------|------------|----------------|
| Ahmed K. | 🟢 On track | Equivalent Fractions (Learn) | — | 22 min |
| Sara M. | 🔴 Needs help | Basic Fractions (Practice) | ⚠️ 2 min ago | 35 min |
| Omar F. | 🟡 Slow progress | Algebra Intro (Learn) | — | 18 min |

Real-time updates (poll every 30s or WebSocket in MVP).

Components:
- Learner status card (photo placeholder, name, grade, current task, status indicator)
- Escalation badge (count of pending escalations)
- "Review" button per learner → goes to Learner Detail screen
- Session timer: how long the current session has been running

---

### 2. Escalation Queue

**URL:** `/mentor/escalations`

Shows all pending escalations, ordered by urgency/time:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  ESCALATION — Sara M.                        2 min ago  │
│ Topic: Basic Fractions                                       │
│ Issue: Sara answered 3/5 check questions wrong and clicked  │
│ "I'm stuck" twice. AI tried 2 different explanations.      │
│                                                              │
│ Evidence: 3 incorrect answers | 2 hints | 12 min stuck      │
│                                                              │
│ AI Suggested Approach: "Try a worked example with objects"  │
│                                                              │
│ [Go to Learner →]   [Mark as Attending ✓]   [Dismiss ✗]    │
└─────────────────────────────────────────────────────────────┘
```

Fields shown per escalation:
- Learner name + grade
- Competency being struggled with
- AI-generated brief (from TASK-08)
- Evidence summary: incorrect answers count, hints requested, time stuck
- Suggested mentor approach (from AI)
- Time since escalation triggered
- Actions: "Go to learner", "Mark attending", "Dismiss with note"

---

### 3. Learner Detail / Session View

**URL:** `/mentor/learners/:learner_id`

Full view of one learner's current session and history:

#### Tabs:
1. **Today's Session** — Live task progress, current resource, AI interaction count, time elapsed
2. **Twin Summary** — Competency states (table: topic, mastery level, last practiced, review due)
3. **Session History** — List of past sessions with completion status and outcome summary
4. **Mentor Notes** — All previous mentor notes; form to add new note
5. **Goals** — Learner's current academic goals

#### Today's Session Panel:
```
Current Task: Equivalent Fractions – Video Lesson
Status: Active | Time: 18 min elapsed
AI Interactions: 3 questions asked
Check Questions: 2 attempted, 1 correct

[View Session Events Log]  [Add Note]  [Trigger Check-In]
```

#### Session Events Log (within Today's Session):
- Chronological list of all events (from TASK-07)
- Colour-coded: ✅ green for correct, ❌ red for incorrect, ⚠️ orange for hints/escalation
- Searchable/filterable by event type

---

### 4. Add Mentor Note

Available from:
- Learner Detail screen
- Escalation resolution flow

Form fields:
```
Note Type: [Observation | Escalation | Praise | Concern]
Linked to Competency: [dropdown — current topic pre-selected]
Note text: [textarea]
[Save Note]
```

Notes are stored in `mentor_notes` table (TASK-04) and become part of the Digital Twin.

---

### 5. Mentor Weekly Summary (Read-only)

**URL:** `/mentor/summary`

A read-only summary for the mentor's own records:
- Sessions run this week: count
- Escalations handled: count
- Most common struggle areas across cohort
- Learners who haven't attended (at-risk flag)

---

## Design Requirements

### Visual Design
- Professional, data-dense UI (not childish — this is for coaches)
- Status colours: 🟢 on track, 🟡 progressing slowly, 🔴 needs help, ⚪ not started
- Real-time escalation badge in top nav (red dot + count)
- Dark mode preferred for long coach sessions

### Real-Time Updates (MVP)
- Poll `/mentor/dashboard/status?session_id=...` every 30 seconds
- Display "Last updated: 30s ago" indicator
- On new escalation → play a subtle audio alert + highlight the escalation card

---

## API Endpoints (Mentor-Facing)

```
GET /mentor/dashboard                         -- Overview of all assigned learners
GET /mentor/escalations                       -- Pending escalation queue
POST /mentor/escalations/:id/attend           -- Mark mentor is attending
POST /mentor/escalations/:id/resolve          -- Resolve with outcome note
GET /mentor/learners                          -- List assigned learners
GET /mentor/learners/:id                      -- Learner detail + Twin summary
GET /mentor/learners/:id/session/today        -- Today's session live status
GET /mentor/learners/:id/sessions             -- Session history
POST /mentor/learners/:id/notes               -- Add mentor note
GET /mentor/learners/:id/notes                -- Get mentor notes
GET /mentor/summary?week=2026-W30             -- Weekly summary
```

### Escalation Endpoints Detail

```
POST /mentor/escalations/:id/resolve
{
  "outcome": "resolved",           // 'resolved', 'referred', 'deferred'
  "mentor_note": "Tried a worked example with fractions on whiteboard. Sara got it after 5 minutes.",
  "competency_update": {
    "competency_id": "comp-fractions-basic",
    "mastery_level": "developing",
    "mentor_confidence": 3
  }
}
```

---

## Escalation Schema

```sql
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL,
  trigger_type VARCHAR(50),            -- 'learner_requested', 'ai_suggested', 'system_rule'
  competency_id UUID REFERENCES competencies(id),
  brief_text TEXT,                     -- AI-generated brief
  evidence_snapshot JSONB,             -- Evidence at time of escalation
  ai_suggested_approach TEXT,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending','attending','resolved','dismissed')),
  assigned_mentor_id UUID REFERENCES users(id),
  attended_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Mock Data (MVP Seed)

```json
{
  "escalations": [
    {
      "id": "esc-001",
      "learner_id": "learner-002",
      "learner_name": "Sara Malik",
      "competency": "Basic Fractions",
      "trigger_type": "ai_suggested",
      "brief_text": "Sara has answered 3/5 check questions incorrectly and clicked 'I'm stuck' twice. Two AI explanations were tried. The concept may require hands-on intervention.",
      "evidence_snapshot": {
        "incorrect_answers": 3,
        "hints_requested": 2,
        "ai_explanations_given": 2,
        "time_stuck_min": 12
      },
      "ai_suggested_approach": "Try a worked example using physical objects or drawing fractions on paper.",
      "status": "pending",
      "created_at": "2026-07-22T09:35:00Z"
    }
  ],
  "learner_statuses": [
    { "learner_id": "learner-001", "name": "Ahmed Khan", "status": "on_track", "current_task": "Equivalent Fractions (Learn)", "time_min": 22 },
    { "learner_id": "learner-002", "name": "Sara Malik", "status": "needs_help", "current_task": "Basic Fractions (Practice)", "time_min": 35, "escalation_id": "esc-001" }
  ]
}
```

---

## Acceptance Criteria

- [ ] Dashboard shows real-time learner status cards for all assigned learners
- [ ] Escalation queue shows pending escalations with AI brief and evidence
- [ ] "Mark attending" updates escalation status and timestamps
- [ ] "Resolve" saves outcome note and updates escalation record
- [ ] Learner detail shows today's session progress (tasks, AI interactions, check results)
- [ ] Mentor can add a note linked to a competency
- [ ] Session event log shows chronological events colour-coded by type
- [ ] Twin summary table shows mastery levels for all competencies
- [ ] Dashboard auto-refreshes every 30s with last-updated indicator
- [ ] Escalation badge count updates on new escalation (within refresh interval)

---

## Dependencies
- **TASK-03**: Auth (mentor JWT)
- **TASK-04**: Digital Twin (competency states, mentor notes)
- **TASK-05**: Core Services API (session + task data)
- **TASK-07**: Event Log (live session events)
- **TASK-08**: AI Companion (escalation brief generation)

---

## Notes for LLM Agent
- Build as a React web app (separate from the learner client)
- Use polling (setInterval) for real-time updates in MVP — no WebSockets needed yet
- The escalation card is the most important UI element — make it scannable and actionable
- Mentor notes are high-value — ensure they are linked to competencies and time-stamped
- All write actions (resolve, add note) must emit an event to the event log (TASK-07)
- Consider a simple notification sound on new escalation (browser Audio API)

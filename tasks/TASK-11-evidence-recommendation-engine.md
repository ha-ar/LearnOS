# TASK-11: Evidence Engine & Recommendation Engine

## Overview
Build the **Evidence Engine** (turns learning activity into structured competency updates) and the **Recommendation Engine** (chooses the next best action for each learner). These are the core "intelligence" services of LearnOS. For MVP, both must be **rule-based, transparent, and auditable** — no ML until sufficient quality data exists.

## Context (from LearnOS Product Document)

### Evidence Engine
> "The Evidence Engine turns learning activity into structured events and links those events to competencies. It prevents LearnOS from confusing activity with achievement. Watching 100% of a video is useful evidence of exposure; it is not evidence of understanding."

### Recommendation Engine
> "The Recommendation Engine chooses the next best action; the Diagnostic Engine estimates why progress may have stalled. Both must produce hypotheses with evidence and confidence — not fixed labels about a child."

**MVP Design Rule:**
> "Begin rule-based and transparent. Example: after two incorrect attempts plus one failed re-explanation, offer a mentor escalation. Use machine learning only after enough high-quality, governed outcome data exists."

---

## Evidence Engine

### Purpose
Convert raw session events into meaningful competency state updates on the Digital Twin.

**Critical distinction:**
- `resource_completed` = evidence of **exposure** (not mastery)
- `check_question_correct` = evidence of **understanding** (primary evidence)
- `mentor_note` = high-value **contextual evidence**

### Evidence Weights

| Event Type | Evidence Category | Weight | Update Rule |
|-----------|------------------|--------|------------|
| `resource_opened` / `resource_completed` | Exposure | Very Low | Record in history only; do not update mastery |
| `video_paused` / `resource_retry` | Engagement signal | Low | Note difficulty signal; no mastery update |
| `hint_requested` | Difficulty signal | Low | Increment difficulty counter |
| `check_question_correct` | Primary evidence | High | Increment correct_attempts; trigger mastery recalculation |
| `check_question_incorrect` | Primary evidence | High | Increment incorrect_attempts; trigger prerequisite check |
| `check_completed` (all correct) | Strong evidence | High | Move mastery toward 'proficient' |
| `reflection_submitted` + `confidence_reported` | Metacognitive signal | Medium-Low | Update learner_confidence; do not change mastery alone |
| `mentor_note` (structured) | Contextual evidence | High | Update evidence_summary; mentor can directly update mastery level |

### Mastery Calculation (MVP: Simple Ratio)

```
mastery_score = (correct_attempts / total_check_attempts) weighted by recency

mastery_level mapping:
  score >= 0.85 AND attempts >= 5  → 'mastered'
  score >= 0.70 AND attempts >= 3  → 'proficient'
  score >= 0.50 AND attempts >= 2  → 'developing'
  score >= 0.20 AND attempts >= 1  → 'emerging'
  else                             → 'not_started'
```

Rules:
- Minimum 2 attempts before mastery is above 'emerging'
- Minimum 3 attempts before 'proficient'
- Minimum 5 attempts before 'mastered'
- Score decays toward 'needs_review' if `review_due_at` is passed (spaced repetition)

### Evidence Engine Process (Called after each session)

```
function runEvidenceEngine(session_id):
  1. Get all events for session_id from event log
  2. For each competency touched this session:
     a. Collect all check_question events for this competency
     b. Calculate score = correct / total
     c. Apply recency weight (more recent attempts weight more)
     d. Look up existing mastery state from Digital Twin
     e. Update: attempts, score, mastery_level, last_practiced_at
     f. Set review_due_at = last_practiced_at + review_interval(mastery_level)
     g. Update evidence_summary (human-readable, linking to events)
  3. Check for prerequisite gaps:
     - If competency X is failing, check if its prerequisites are mastered
     - Flag prerequisite gap for Recommendation Engine
  4. Persist all updates to learner_competency_states table
  5. Log Evidence Engine run to audit table
```

### Spaced Repetition Review Intervals

| Mastery Level | Review Due |
|--------------|-----------|
| emerging | 2 days |
| developing | 5 days |
| proficient | 14 days |
| mastered | 30 days |

---

## Diagnostic Engine (Part of Recommendation Engine)

The Diagnostic Engine identifies **why progress may have stalled** and generates hypotheses — not labels.

### Signal Pattern → Hypothesis Table

| Signal Pattern | Cautious Hypothesis | Possible Response |
|---------------|--------------------|--------------------|
| Repeated errors on same concept's prerequisite | Possible prerequisite gap | Review the underlying concept; use a short prerequisite check |
| Several pauses + repeated "I do not understand" | Current explanation may not be landing | Change modality, simplify, use a worked example |
| Fast, accurate completion + high confidence | Likely ready for enrichment | Offer a harder problem, application or project |
| Multiple AI approaches did not improve outcome | AI support may be insufficient | Notify a mentor with a concise evidence summary |
| Long uninterrupted session + worsening accuracy | Possible fatigue or overload | Suggest a break or shorter task; leave final judgement to coach |

Diagnostic output is always:
```json
{
  "hypothesis": "possible_prerequisite_gap",
  "confidence": "low",   // low, medium, high
  "evidence": [...],     // list of supporting events
  "suggested_action": "review_prerequisite",
  "data": { "prerequisite_competency_id": "comp-fractions-basic" }
}
```

---

## Recommendation Engine

### Purpose
Determine the **next best action** for a learner at any moment during a session.

### Decision Tree (Rule-Based MVP)

```
function getNextBestAction(learner_id, session_id, current_task_id):
  1. Get current session state (task list, current position)
  2. Get current competency state from Twin
  3. Run Diagnostic Engine to detect any patterns
  4. Apply decision rules:

  Rule 1: Escalation threshold reached?
    → IF (incorrect_answers_this_task >= 3 AND hints >= 2 AND ai_attempts >= 2)
    → THEN: action = mentor_escalation

  Rule 2: Prerequisite gap detected?
    → IF diagnostic.hypothesis == 'possible_prerequisite_gap'
    → THEN: action = switch_to_prerequisite_resource
            resource = select_resource(prerequisite_competency_id, fallback=true)

  Rule 3: Current resource not helping?
    → IF (same_resource_opened_twice AND check_score_unchanged)
    → THEN: action = switch_resource (get fallback from TASK-06)

  Rule 4: Ready to advance?
    → IF (check_score >= 0.80 AND task_type == 'practice' AND completed)
    → THEN: action = advance_to_next_task

  Rule 5: Break suggested?
    → IF (session_duration_min >= 40 AND worsening_accuracy_trend)
    → THEN: action = suggest_break (duration_min = 5)

  Rule 6: Default — continue current task
    → action = continue

  Return: { action_type, resource_id?, message_for_learner, evidence }
```

### Action Types

| Action Type | Description | Who Sees It |
|------------|-------------|------------|
| `continue` | No change needed; learner on track | Learner (subtly) |
| `switch_resource` | Load a different resource for same concept | Learner (new resource shown) |
| `switch_to_prerequisite` | Jump back to prerequisite concept | Learner + mentor notified |
| `mentor_escalation` | Escalate to mentor queue | Mentor (escalation created); learner sees "Your mentor is coming" |
| `advance_to_next_task` | Move to next task in session plan | Learner (task marked complete) |
| `suggest_break` | Pause the session | Learner (break screen shown) |
| `session_complete` | All tasks done | Learner (reflection screen) |

---

## API Endpoints

### Evidence Engine
```
POST /evidence/run?session_id=...         -- Run evidence engine for a session (called on session end)
POST /evidence/run/incremental            -- Run partial evidence update (called mid-session)
GET  /evidence/audit?learner_id=...&session_id=...  -- Get evidence engine audit log
```

### Recommendation Engine
```
POST /recommendations/next-action         -- Get next best action for learner
Body: { "learner_id": "...", "session_id": "...", "current_task_id": "..." }

Response:
{
  "action_type": "mentor_escalation",
  "confidence": "high",
  "evidence": [
    { "event_type": "check_question_incorrect", "count": 3 },
    { "event_type": "hint_requested", "count": 2 }
  ],
  "message_for_learner": "It looks like you need some extra support. Your mentor is on the way!",
  "escalation_brief": { ... },
  "rule_fired": "escalation_threshold_rule"
}
```

### Diagnostic Engine
```
POST /diagnostics/run                    -- Run diagnostics for a learner+session
GET  /diagnostics/:learner_id           -- Get current diagnostic hypotheses for learner
```

---

## Database Schema

```sql
-- Evidence Engine audit log
CREATE TABLE evidence_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  run_type VARCHAR(50),                   -- 'full', 'incremental'
  competencies_updated INT,
  events_processed INT,
  mastery_changes JSONB,                  -- What changed: { competency_id, from, to }
  run_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT
);

-- Recommendation log (audit every recommendation made)
CREATE TABLE recommendation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  rule_fired VARCHAR(100),
  confidence VARCHAR(50),
  evidence JSONB,
  acted_upon BOOLEAN,                     -- Did learner/system act on it?
  outcome VARCHAR(100),                   -- 'helped', 'neutral', 'ignored' (set retroactively)
  recommended_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnostic hypotheses
CREATE TABLE diagnostic_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  session_id UUID,
  competency_id UUID REFERENCES competencies(id),
  hypothesis VARCHAR(100) NOT NULL,
  confidence VARCHAR(50),
  evidence JSONB,
  suggested_action VARCHAR(100),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Acceptance Criteria

### Evidence Engine
- [ ] `POST /evidence/run?session_id=...` correctly updates mastery scores for practiced competencies
- [ ] `resource_completed` alone does NOT increase mastery score (only check questions do)
- [ ] Mastery level mapping (not_started → mastered) works correctly per scoring thresholds
- [ ] `review_due_at` is set per mastery level (spaced repetition intervals)
- [ ] Evidence summary is human-readable and traces back to specific events
- [ ] Prerequisite gap is detected when failing competency has unmastered prerequisites

### Recommendation Engine
- [ ] `POST /recommendations/next-action` returns correct action for each signal pattern
- [ ] Escalation rule fires after 3 incorrect + 2 hints + 2 AI attempts
- [ ] Resource switch rule fires when same resource used twice with no improvement
- [ ] Recommendation log saves every recommendation with the rule that fired
- [ ] Advance-to-next-task rule fires when check score ≥ 80% on practice task
- [ ] All decisions produce an evidence array (no opaque recommendations)

---

## Dependencies
- **TASK-04**: Digital Twin (reads and writes competency states)
- **TASK-07**: Event Log (reads session events)
- **TASK-06**: Resource Layer (gets fallback resource for resource_switch action)
- **TASK-08**: AI Companion (escalation brief generation)
- **TASK-09**: Mentor Dashboard (creates escalation record)
- **TASK-05**: Core Services API (advance task in session plan)

---

## Notes for LLM Agent
- Evidence Engine runs: (a) at session end (full run), (b) incrementally after each check question (live update)
- All rules must be named constants — easy to read, adjust, and audit
- NEVER make a mastery update without logging the evidence that justified it
- The Recommendation Engine output must always include `rule_fired` — which rule caused this recommendation
- In MVP: no ML, no neural networks, no probabilistic models — pure if/then rules only
- Future ML hook: `recommendation_log.acted_upon + outcome` is the training data for future ML models
- Consider a separate config file for all rule thresholds (e.g., `config/recommendation-rules.json`) so they can be tuned without code changes

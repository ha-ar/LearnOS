# TASK-06: Resource Intelligence Layer — Catalogue, Connectors & Ranking

## Overview
Build the **Resource Intelligence Layer** — the system that manages approved learning resources, maps them to curriculum competencies, and serves the right resource for the right learner at the right moment. For MVP, this is a curated catalogue with rule-based selection. No web scraping, no uncontrolled external content.

## Context (from LearnOS Product Document)
> "LearnOS will initially use existing, high-quality resources rather than attempting to create a full curriculum library. Khan Academy can be a primary academic resource where its curriculum, terms and available integration methods are appropriate. Additional resources are selected only through a curated catalogue and provider-specific connector, not by uncontrolled web search during a child's session."

**Provider Integration Rule:**
> "Provider integration is a commercial and legal workstream. LearnOS must respect content ownership, APIs, embedding permissions, attribution requirements, age rules and terms of service. 'Integration' does not mean scraping, copying or bypassing provider experiences."

---

## Functions to Build

| Function | What It Does | MVP Approach |
|----------|-------------|--------------|
| **Resource Catalogue** | Maps approved resources to competencies, grade/curriculum, format, licensing status | Curated catalogue for narrow academic scope (Maths + 1 subject, Grades 6–8) |
| **Provider Connector** | Uses permitted APIs, embeds, deep links or launch flows | Build one adapter per provider; retain provider attribution |
| **Resource Ranking** | Selects a fit based on objective and learner evidence | Rules first: grade, concept, format, duration, prior outcome |
| **Fallback Path** | Changes approach if a learner is still stuck | Alternative approved video, worked example, simulation, mentor escalation |
| **Outcome Feedback** | Records whether resource use was associated with progress | Session evidence: check questions after resource → competency update |

---

## Database Schema

```sql
-- Providers (Khan Academy, internal, etc.)
CREATE TABLE resource_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,             -- e.g., "Khan Academy"
  type VARCHAR(100),                       -- 'api', 'embed', 'deep_link', 'internal'
  base_url TEXT,
  attribution_text TEXT,                   -- Required attribution string
  terms_url TEXT,
  is_active BOOLEAN DEFAULT true,
  age_min INT DEFAULT 5,
  age_max INT DEFAULT 18,
  integration_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Catalogue
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES resource_providers(id),
  external_id VARCHAR(255),               -- Provider's own ID (e.g., Khan Academy exercise ID)
  title VARCHAR(500) NOT NULL,
  description TEXT,
  format VARCHAR(100) NOT NULL            -- 'video', 'exercise', 'article', 'interactive', 'quiz', 'internal_quiz'
    CHECK (format IN ('video','exercise','article','interactive','quiz','internal_quiz','simulation')),
  url TEXT,                               -- Direct URL or deep link
  embed_url TEXT,                         -- Iframe-safe embed URL (if permitted)
  duration_min INT,                       -- Estimated duration
  grade_min INT,                          -- e.g., 6
  grade_max INT,                          -- e.g., 8
  language VARCHAR(50) DEFAULT 'en',
  is_age_safe BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  attribution TEXT,                       -- Full attribution as required by provider
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource ↔ Competency Mapping
CREATE TABLE resource_competency_map (
  resource_id UUID NOT NULL REFERENCES resources(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  fit_type VARCHAR(50) DEFAULT 'primary'  -- 'primary', 'supplementary', 'prerequisite_support'
    CHECK (fit_type IN ('primary','supplementary','prerequisite_support')),
  PRIMARY KEY (resource_id, competency_id)
);

-- Resource Usage / Outcome Feedback
CREATE TABLE resource_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  learner_id UUID NOT NULL REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  competency_id UUID REFERENCES competencies(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_sec INT,
  check_questions_attempted INT DEFAULT 0,
  check_questions_correct INT DEFAULT 0,
  learner_confidence_after INT,            -- 1–5
  outcome_label VARCHAR(50)                -- 'helped', 'neutral', 'did_not_help', 'too_hard', 'too_easy'
);
```

---

## Resource Selection Algorithm (Rule-Based MVP)

```
function selectResource(learner, competency, session_context):
  1. Get all resources mapped to this competency
  2. Filter by:
     - Grade matches learner's grade level
     - Language matches learner's language
     - `is_age_safe = true`
     - Not used in last 2 sessions (avoid repetition)
  3. Rank by:
     a. Learner's preferred format (from Twin.learning_profile.preferred_format)
     b. Resources with positive prior outcome for this learner
     c. Duration: prefer shorter if learner pace_signal = 'needs_more_time'
     d. Fresh resources first (not used before by this learner)
  4. Return top 1 (primary) + top 2 fallbacks
  5. If no resources found → return mentor escalation action
```

---

## Fallback Path Logic

```
If learner is stuck after resource attempt:
  Attempt 1: Primary resource (e.g., Khan Academy video)
  Attempt 2: Supplementary resource (different format — e.g., worked example article)
  Attempt 3: Prerequisite review resource (check if prerequisite gap exists)
  Attempt 4: Mentor escalation (generate escalation brief for mentor dashboard)
```

---

## MVP Resource Catalogue (Seed Data)

```json
{
  "providers": [
    {
      "id": "provider-khan",
      "name": "Khan Academy",
      "type": "deep_link",
      "base_url": "https://www.khanacademy.org",
      "attribution_text": "Content by Khan Academy (CC BY-NC-SA 3.0)",
      "age_min": 4,
      "age_max": 18
    },
    {
      "id": "provider-internal",
      "name": "LearnOS Internal",
      "type": "internal",
      "attribution_text": "LearnOS Learning Content"
    }
  ],
  "resources": [
    {
      "id": "res-001",
      "provider_id": "provider-khan",
      "external_id": "equivalent-fractions",
      "title": "Equivalent Fractions – Khan Academy",
      "format": "video",
      "url": "https://www.khanacademy.org/math/arithmetic/fraction-arithmetic/arith-review-equivalent-fractions/v/equivalent-fractions",
      "duration_min": 8,
      "grade_min": 5,
      "grade_max": 7,
      "competency_ids": ["comp-fractions-equivalent"]
    },
    {
      "id": "res-002",
      "provider_id": "provider-internal",
      "title": "Equivalent Fractions – 5 Practice Questions",
      "format": "internal_quiz",
      "duration_min": 10,
      "grade_min": 5,
      "grade_max": 7,
      "competency_ids": ["comp-fractions-equivalent"]
    },
    {
      "id": "res-003",
      "provider_id": "provider-internal",
      "title": "Basic Fractions – Quick Review",
      "format": "article",
      "duration_min": 5,
      "grade_min": 4,
      "grade_max": 6,
      "competency_ids": ["comp-fractions-basic"]
    }
  ]
}
```

---

## API Endpoints

```
GET  /resources?competency_id=...&grade=6&format=video  -- Search catalogue
GET  /resources/:id                                      -- Get resource details
POST /resources/select                                   -- Select best resource for learner+competency (returns primary + fallbacks)
POST /resources/:id/outcome                              -- Record outcome feedback after use
GET  /providers                                          -- List providers (admin)
POST /providers                                          -- Add provider (admin)
POST /resources                                          -- Add resource to catalogue (admin)
```

### `/resources/select` Request/Response
```json
// Request
POST /resources/select
{
  "learner_id": "learner-001",
  "competency_id": "comp-fractions-equivalent",
  "exclude_resource_ids": ["res-001"]
}

// Response
{
  "primary": { "resource_id": "res-001", "title": "...", "format": "video", "url": "...", "attribution": "..." },
  "fallbacks": [
    { "resource_id": "res-002", "title": "...", "format": "internal_quiz" },
    { "resource_id": "res-003", "title": "...", "format": "article" }
  ],
  "escalation_threshold_reached": false
}
```

---

## Internal Quiz System (MVP: Basic)

For `internal_quiz` format resources, LearnOS serves its own check questions.

```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  competency_id UUID REFERENCES competencies(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice','true_false','short_answer')),
  options JSONB,                    -- For multiple choice: [{"key": "a", "text": "..."}]
  correct_answer VARCHAR(10),       -- 'a', 'b', 'c', 'd' or 'true'/'false'
  explanation TEXT,                 -- Shown after answer
  difficulty VARCHAR(50) DEFAULT 'medium'
    CHECK (difficulty IN ('easy','medium','hard')),
  grade_level INT
);
```

---

## Acceptance Criteria

- [ ] `GET /resources?competency_id=...` returns matching resources from catalogue
- [ ] `POST /resources/select` returns the correct best-fit resource + 2 fallbacks using rule-based algorithm
- [ ] Resource ranking respects learner's preferred format from Twin
- [ ] Previously-used resources are deprioritised
- [ ] `POST /resources/:id/outcome` saves outcome feedback to DB
- [ ] Mock catalogue seeds correctly with at least 6 resources across 3 competencies
- [ ] Internal quiz questions are served and scored correctly
- [ ] All endpoints protected by auth middleware

---

## Dependencies
- **TASK-04**: Digital Twin (learning profile for ranking, previous resource history)
- **TASK-05**: Core Services API (session tasks reference resources)
- **TASK-03**: Auth service

---

## Notes for LLM Agent
- Do NOT implement real Khan Academy API calls in MVP — use deep links only (URL opens in player)
- The internal quiz format is the one we fully control; build it properly
- Resource ranking must be deterministic and explainable (log the reason for selection)
- Add seed migration script for resources and competency mappings
- Future: add ML-based ranking — but MVP rule-based only
- Provider connector is just a URL template for MVP (no OAuth to provider needed in Phase 1)

# TASK-08: AI Learning Companion Service

## Overview
Build the **AI Learning Companion** — the context-aware AI assistant that a learner talks to during their session. This is NOT a generic chatbot. It receives structured session context and uses it to provide grounded, age-appropriate explanations tied to the exact lesson, competency, learner history, and current objective.

## Context (from LearnOS Product Document)
> "The AI Learning Companion is a context-aware co-teacher, not an isolated chatbot. It receives structured session context so that a learner can ask a natural question — such as 'Why did she divide by two?' — and receive an answer tied to the exact lesson, timestamp, concept, learner history and current objective."

**IMPORTANT BOUNDARY:**
> "LearnOS does not require AGI or autonomous self-training. It uses existing AI models, structured data, rules, retrieval and human review to make bounded learning decisions."

---

## What the Companion Can Do

1. **Explain** a concept in simpler language, with an alternative analogy or a worked example
2. **Generate** a short diagnostic check (not a high-stakes assessment) to see whether an explanation helped
3. **Surface** a relevant, approved alternative resource when the first one is not working
4. **Summarise** the session and prepare a structured escalation brief for a mentor
5. **Operate** within safety, age-appropriate language and content policies; avoid unsupported claims about wellbeing or ability

---

## Input Context (What the Companion Receives)

| Context | How the Companion Uses It |
|---------|--------------------------|
| Lesson metadata and timestamp | References the active explanation rather than asking the learner to restate it |
| Competency and prerequisite state | Explains at the right level and identifies missing foundations |
| Recent attempts and confidence | Avoids repeating an unhelpful explanation; adjusts difficulty and modality |
| Student artefacts (selected text, photo of work) | Interprets selected content when consented and supported |
| Session actions (pauses, retries, repeated questions) | Responds to difficulty signals with gentle, non-punitive help |

---

## Companion Interaction Modes

### Mode 1: Free Question
Learner types a natural language question. Companion answers with session context.

### Mode 2: Quick Actions (Buttons)
- **"Explain again"** → Re-explain the current concept differently (different analogy/format)
- **"I'm stuck"** → Trigger diagnostic check + possible resource change
- **"Check me"** → Generate a short check question on current topic
- **"I'm ready to move on"** → Signal readiness; trigger competency confidence update

### Mode 3: Highlight-to-Ask
Learner selects text in the learning player → text is sent to Companion with: "The learner selected this text from [resource title]: '[selected text]'. They may have a question about it."

### Mode 4: Escalation Brief Generation
When escalation threshold is reached, Companion generates a structured brief for the mentor queue:
```json
{
  "learner_name": "Ahmed",
  "competency": "Equivalent Fractions",
  "issue_summary": "Ahmed has watched the video twice and answered 2/3 check questions incorrectly. He clicked 'I'm stuck' twice. The current explanation may not be landing.",
  "evidence": [
    { "event": "check_question_incorrect", "question": "Which fraction equals 2/4?", "answer": "c" },
    { "event": "hint_requested", "count": 2 }
  ],
  "suggested_approach": "Try a worked example with physical objects or a different visual method.",
  "resource_attempted": "Equivalent Fractions – Khan Academy (Video)"
}
```

---

## Architecture

### Prompt Assembly (Context Engine)

Before every AI call, the **Context Engine** assembles a structured prompt:

```
SYSTEM PROMPT:
You are a patient, encouraging learning assistant for a 10–16 year old learner.
You must answer ONLY based on the lesson context provided.
Do not make claims about the learner's intelligence, potential, or personal traits.
Keep responses concise, clear, and age-appropriate.
Do not recommend external websites or resources not in the approved list.
Always respond in [learner's language: English / Urdu].

LEARNER CONTEXT:
- Name: Ahmed
- Grade: 6
- Current Competency: Equivalent Fractions
- Current Resource: "Equivalent Fractions" video by Khan Academy
- Resource Timestamp: 3 minutes 42 seconds
- Mastery Level: Emerging (0.3)
- Prerequisite Status: Basic Fractions — Proficient

RECENT SESSION EVENTS (last 5):
- resource_opened: Equivalent Fractions video
- video_paused at 3:42
- hint_requested
- check_question_incorrect: Q: "Which equals 2/4?" A given: "c" (correct: "b")
- ai_question_asked: [current question]

LEARNER QUESTION:
"Why did she divide by two?"

APPROVED RESOURCES (for fallback suggestion only):
- "Equivalent Fractions – Worked Example" (article, internal)
- "Equivalent Fractions – Practice Quiz" (quiz, internal)
```

### AI Provider
- MVP: Use OpenAI GPT-4o or Google Gemini Pro via API
- **Provider-agnostic gateway**: Use an abstraction layer so the provider can be swapped
- Guardrails: max response length, content filter, no external URL suggestions

### Retrieval-Augmented Generation (RAG) — MVP Lightweight
- For MVP: inject resource summary text directly into prompt (no vector DB needed)
- Resource summaries stored in `resources.description` column
- Retrieve up to 500 tokens of resource context

---

## API Endpoints

### Companion Chat
```
POST /ai/companion/chat
Authorization: Bearer <learner_jwt>
{
  "session_id": "...",
  "message": "Why did she divide by two?",
  "mode": "free_question",          // or: 'explain_again', 'stuck', 'check_me', 'highlight_ask'
  "highlight_text": null,           // If mode=highlight_ask, the selected text
  "context_override": null          // Reserved for testing
}

Response:
{
  "data": {
    "interaction_id": "...",
    "response_text": "Great question! When we make equivalent fractions, we can divide both the top and bottom number by the same amount...",
    "mode": "free_question",
    "action_suggestions": [
      { "type": "resource_switch", "resource_id": "res-worked-example", "label": "See a worked example" },
      { "type": "check_me", "label": "Test your understanding" }
    ],
    "escalation_suggested": false,
    "token_usage": { "prompt": 420, "completion": 85 }
  }
}
```

### Generate Check Question
```
POST /ai/companion/generate-check
{
  "session_id": "...",
  "competency_id": "comp-fractions-equivalent",
  "difficulty": "medium",
  "question_count": 1
}

Response:
{
  "data": {
    "question_id": "ai-q-001",
    "question_text": "Which of these fractions is equivalent to 3/6?",
    "question_type": "multiple_choice",
    "options": [
      { "key": "a", "text": "2/3" },
      { "key": "b", "text": "1/2" },
      { "key": "c", "text": "3/4" },
      { "key": "d", "text": "6/12" }
    ],
    "correct_answer": "b",
    "explanation": "3/6 = 1/2 because both top and bottom divide by 3. Also 6/12 = 1/2, so both B and D are correct — great catch!",
    "competency_id": "comp-fractions-equivalent"
  }
}
```

### Generate Escalation Brief
```
POST /ai/companion/escalation-brief
{
  "session_id": "...",
  "learner_id": "..."
}

Response:
{
  "data": {
    "brief_text": "Ahmed (Grade 6) has been working on Equivalent Fractions for 18 minutes...",
    "structured_brief": { ... },
    "recommended_mentor_approach": "..."
  }
}
```

### Interaction History
```
GET /ai/companion/history?session_id=...&limit=20
```

---

## Database

```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  mode VARCHAR(50),
  highlight_text TEXT,
  context_snapshot JSONB,         -- The context sent to AI (for audit)
  response_text TEXT,
  action_suggestions JSONB,
  escalation_suggested BOOLEAN DEFAULT false,
  provider VARCHAR(100),          -- 'openai_gpt4o', 'gemini_pro', etc.
  model_version VARCHAR(100),
  prompt_tokens INT,
  completion_tokens INT,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_check_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  learner_id UUID NOT NULL,
  competency_id UUID,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),
  options JSONB,
  correct_answer VARCHAR(20),
  explanation TEXT,
  answer_given VARCHAR(20),
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Safety & Content Policy

All AI responses must pass through a content filter before sending to learner:

```typescript
function enforceContentPolicy(response: string): PolicyResult {
  // Block if response contains:
  // - External URLs not in approved list
  // - Personal claims about learner ability/intelligence
  // - Off-topic content (not related to current subject)
  // - Unsafe content (violence, adult content)
  // - Medical, legal, or professional advice
  return { safe: boolean, filtered_response: string, flag_reason?: string };
}
```

Escalation triggers (rule-based in MVP):
- Learner asks 3+ questions on same concept without improvement → suggest mentor
- AI detects distress language → flag for mentor + generate welfare check prompt
- Learner attempts same check question incorrectly 3 times → escalate to mentor

---

## Mock AI Responses (MVP: Fallback)

For MVP testing without live AI API, use a mock response map:

```json
{
  "mock_responses": {
    "explain_again": "Let me try explaining this a different way. Imagine you have a pizza cut into 2 slices and eat 1 — that's 1/2. Now imagine the same pizza cut into 4 slices and you eat 2 — that's 2/4. They're the same amount! That's what equivalent fractions means.",
    "stuck": "Don't worry, this can be tricky! Let's slow down. The key idea is: if you multiply or divide BOTH the top and bottom number by the same number, you get an equivalent fraction.",
    "check_me": "Here's a quick question: Which fraction equals 1/2? A) 2/3  B) 2/4  C) 3/4  D) 4/5",
    "i_am_ready": "Great work! You've shown a good understanding of equivalent fractions. Let's move on to the practice questions to solidify your knowledge."
  }
}
```

---

## Acceptance Criteria

- [ ] `POST /ai/companion/chat` returns a contextual response (using mock or live AI)
- [ ] Prompt includes learner context, session state, and recent events
- [ ] Mode-specific behaviour: `explain_again` produces a different explanation format
- [ ] `POST /ai/companion/generate-check` returns a valid multiple-choice question
- [ ] `POST /ai/companion/escalation-brief` returns a mentor-ready brief
- [ ] All interactions stored in `ai_interactions` table with context snapshot
- [ ] Content policy function rejects responses containing external URLs
- [ ] Escalation is suggested after 3 hint requests or 3 incorrect check answers
- [ ] Mock mode works without any API key (for development)

---

## Dependencies
- **TASK-03**: Auth (learner identity)
- **TASK-04**: Digital Twin (competency context, mastery level, learning profile)
- **TASK-05**: Core Services API (current session + task context)
- **TASK-07**: Event Log (reads recent events for context window)
- **TASK-09**: Mentor Dashboard (receives escalation briefs)

---

## Notes for LLM Agent
- Wrap all LLM calls in a provider-agnostic interface: `interface AIProvider { complete(prompt: string): Promise<string> }`
- Implement both a `MockAIProvider` and a real provider (OpenAI or Gemini)
- Measure and log latency for every AI call
- Prompt must be rebuilt fresh on each request (do not share context across learners)
- Keep total prompt token count under 2000 for MVP (cost and latency)
- All prompts must be stored in audit log for review
- Never send learner PII (full name, address, etc.) to external AI provider — use learner_id only

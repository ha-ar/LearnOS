# TASK-02: Learning Workspace UI — Student-Facing Screens

## Overview
Build the full **Learning Workspace UI** — the main interface learners interact with throughout every session. This runs inside the Flutter client (TASK-01) and must be a clean, focused, distraction-resistant environment. Built entirely in Flutter/Dart — same codebase renders on Windows, macOS, and iOS.

## Context (from LearnOS Product Document)
> "The Learning Workspace is the product learners see all day. Its role is not merely to make a website full-screen; it is to remove the planning and navigation burden that causes distraction. The learner should almost never need to search for a topic or open a separate browser tab."

---

## Screens to Build (MVP)

### 1. Login Screen
- Username + PIN input
- School/centre branding (logo placeholder)
- "Sign in" button
- Error state (wrong credentials)
- Loading state

### 2. Today's Mission Screen (Session Start)
- Session date and greeting ("Good morning, Ahmed!")
- Session goal summary card (plain language): e.g., _"Review fractions; learn equivalent fractions; practise; reflect."_
- Task list preview with estimated durations
- "Start Session" button
- Optional: motivational micro-message

### 3. Main Learning Workspace (Core Screen)

This is the primary screen. It contains all 6 areas simultaneously:

#### Layout (suggested grid)

```
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS STRIP: [Mission badge] [Time: 24 min left] [Tasks] │
├──────────────────────────┬──────────────────────────────────┤
│                          │  AI COMPANION PANEL              │
│   MAIN LEARNING PLAYER   │  ┌────────────────────────────┐  │
│                          │  │ Context: Equivalent Fracs  │  │
│  (Embedded resource,     │  │ Q: "Why did she divide?"   │  │
│   video, PDF, quiz,      │  │ A: [AI response here]      │  │
│   simulation)            │  │                            │  │
│                          │  │ [Ask a question...]        │  │
│                          │  └────────────────────────────┘  │
│                          │  TOOLS                           │
│                          │  [Notes] [Whiteboard] [Calc]     │
├──────────────────────────┴──────────────────────────────────┤
│ TODAY'S MISSION: [t1✓] [t2 active] [t3] [t4]               │
│ NEXT ACTION: "Try two practice questions →"                 │
└─────────────────────────────────────────────────────────────┘
```

#### Workspace Areas Detail

| Area | Description | Mock Behaviour |
|------|-------------|---------------|
| **Progress Strip** | Top bar: current objective label, time remaining, task progress indicators (dots/steps) | Static from mock session plan |
| **Main Learning Player** | Centre panel: renders the current resource. For MVP: YouTube embed or Khan Academy iframe (if permitted), or internal HTML content viewer | Show a mock Khan Academy-style explainer page |
| **AI Companion Panel** | Right panel: chat-style interface with session context shown at top. Input box for learner questions. AI responses below. "Explain", "Check me", "I'm stuck" quick buttons | Mock AI responses (hardcoded or simple rule-based) |
| **Tools Strip** | Collapsible: Notes (text area), Whiteboard (canvas), Calculator (basic), Glossary (searchable list), Highlight-to-Ask (select text → sends to AI) | Functional notes, basic canvas; highlight-to-ask sends selected text to AI mock |
| **Today's Mission / Task Bar** | Bottom: step-by-step task list showing completed (✓), active (→), upcoming. Clicking should NOT let learner skip ahead | Advance only when current task marked complete |
| **Next Action** | Prominent CTA card that shows the immediate next step | Driven by mock task plan |

### 4. Mentor Escalation Request Screen
- "I need help from my mentor" button/flow in AI panel
- Shows: escalation submitted, wait for mentor
- Mentor ETA display (mock)

### 5. Session Reflection Screen
- End-of-session prompt: "What did you learn today?"
- Confidence slider: "How confident are you about equivalent fractions?" (1–5 stars)
- Optional free-text note
- "Finish Session" button

### 6. Session Complete Screen
- Summary: tasks completed, time spent, concepts covered
- Badge/achievement visual (simple)
- "See you next time" message
- Auto-logout countdown (e.g., 60 seconds)

---

## Design Requirements

### Visual Design
- Child-appropriate (ages 10–16) but not childish — clean, modern, focused
- Dark or light theme toggle (learner preference)
- High contrast, readable fonts (minimum 16px body text)
- No advertisements, social media links, or external navigation
- Colour palette: calm blues/greens (promotes focus), avoid red/orange except for alerts
- Font: Inter or Roboto from Google Fonts

### Micro-interactions
- Task completion: subtle tick animation + progress bar fill
- AI response: typing indicator (ellipsis animation)
- Resource load: skeleton loader
- Mentor escalation: pulse animation on button while waiting

### Accessibility
- Keyboard navigable (Tab order)
- Screen-reader friendly labels on all interactive elements
- Focus ring visible

---

## Mock Data Structures

### Session Plan (mock)
```json
{
  "session_id": "session-mock-001",
  "learner_name": "Ahmed",
  "date": "2026-07-22",
  "goal": "Review fractions; learn equivalent fractions; practise; reflect.",
  "tasks": [
    {
      "id": "t1", "type": "review", "title": "Quick Review: Basic Fractions",
      "duration_min": 10, "resource_id": null, "status": "completed"
    },
    {
      "id": "t2", "type": "learn", "title": "Equivalent Fractions – Video Lesson",
      "duration_min": 15, "resource_id": "mock-resource-khanacad-fractions",
      "status": "active"
    },
    {
      "id": "t3", "type": "practice", "title": "Practice: 5 Questions",
      "duration_min": 10, "resource_id": "mock-quiz-001", "status": "upcoming"
    },
    {
      "id": "t4", "type": "reflect", "title": "Session Reflection",
      "duration_min": 5, "resource_id": null, "status": "upcoming"
    }
  ]
}
```

### AI Companion Mock Responses
```json
{
  "quick_responses": {
    "explain": "Let me explain this in simpler terms...",
    "stuck": "It looks like this concept might be tricky. Let me try a different approach...",
    "check_me": "Great! Let me give you a quick check question..."
  },
  "context": {
    "current_topic": "Equivalent Fractions",
    "current_resource": "Khan Academy: Equivalent Fractions",
    "learner_level": "Grade 6"
  }
}
```

---

## Acceptance Criteria

- [ ] Login screen renders and accepts mock credentials
- [ ] Today's Mission screen shows session goal and task list
- [ ] Main Workspace renders all 6 areas simultaneously without overflow/scroll issues
- [ ] AI Companion panel accepts text input and returns mock responses
- [ ] Task progress updates as tasks are marked complete
- [ ] "I'm stuck" / escalation button triggers mentor escalation screen
- [ ] Session Reflection form submits (mock) and transitions to Session Complete screen
- [ ] Entire flow works end-to-end with mock data — no real backend required
- [ ] UI is responsive to different screen resolutions (1080p, 1366×768 minimum)

---

## Dependencies
- **TASK-01**: Windows Client (this UI runs inside it)
- **TASK-08**: AI Companion API (mock responses in MVP)
- **TASK-05**: Session Plan API (mock data in MVP)

---

## Notes for LLM Agent
- Build as Flutter widgets — all screens are `StatelessWidget` or `ConsumerWidget` (Riverpod)
- Use `go_router` for screen transitions (matches TASK-01 routing setup)
- Use Riverpod (`flutter_riverpod`) for session state management
- The Learning Player for MVP: use `webview_flutter` with a mock HTML file loaded from assets, or a styled Flutter widget showing resource metadata
- Do NOT implement real video scraping or embedding — use a `WebView` pointing to a placeholder URL or local asset
- All mock data should live in `lib/data/mock/` and be toggled via `USE_MOCK` env flag
- Focus on layout correctness and UX flow first, then visual polish
- Use `LayoutBuilder` + `AdaptiveLayout` to handle different screen sizes (Windows 1080p vs iPad)
- The 6-area workspace layout: use `Row` + `Column` with `Expanded` and `Flexible` — no scrolling on the main workspace view

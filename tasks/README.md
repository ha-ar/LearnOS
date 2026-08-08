# LearnOS MVP — Task Index & Execution Guide

## Project Overview

**LearnOS** is an AI-powered Learning Operating System that orchestrates approved learning resources, a context-aware AI Companion, an evidence-backed Digital Twin, and human mentors into a unified, distraction-resistant learning experience.

**MVP Goal:** Prove a focused learning session and mentor escalation loop for **30–100 learners** at a single physical learning centre.

**Document Source:** LearnOS Investor & Product Pitch (July 2026)

---

## MVP Scope (Phase 1 — Centre MVP)

### Include in MVP
- Windows learning-centre client with managed-device/kiosk deployment
- Ages 10–16; one curriculum (Pakistan National Curriculum); Maths as primary subject
- Curated approved resources (Khan Academy deep links + internal quizzes)
- AI Companion with lesson context: explain/ask/check and escalation
- Basic Digital Twin: competency, confidence, attempts, time, resource history, questions asked, mentor notes
- Mentor dashboard, basic parent weekly report, admin controls
- Rule-based recommendation logic and auditable events

### Defer from MVP
- macOS / ChromeOS / iOS parity
- Open-ended web search or content scraping
- Autonomous multi-agent decisioning or opaque predictions
- Hundreds of behavioural, wellness, or personality variables
- Complex social, gamification, or marketplace features
- All grades, curricula, skills tracks, and physical-campus ERP features
- ML-driven recommendations (before sufficient quality data)

---

## Task List

| Task | Title | Layer | Depends On |
|------|-------|-------|-----------|
| [TASK-14](./TASK-14-database-schema-migrations.md) | Database Schema & Migrations | Infrastructure | — |
| [TASK-03](./TASK-03-auth-identity-service.md) | Auth & Identity Service | Backend | TASK-14 |
| [TASK-04](./TASK-04-digital-twin-learner-model.md) | Digital Twin — Learner Model | Backend | TASK-14, TASK-03 |
| [TASK-05](./TASK-05-core-services-api.md) | Core Services API (Sessions, Plans) | Backend | TASK-14, TASK-03, TASK-04 |
| [TASK-06](./TASK-06-resource-intelligence-layer.md) | Resource Intelligence Layer | Backend | TASK-14, TASK-03 |
| [TASK-07](./TASK-07-event-log-telemetry-service.md) | Event Log & Session Telemetry | Backend | TASK-14, TASK-03 |
| [TASK-08](./TASK-08-ai-learning-companion.md) | AI Learning Companion | Backend | TASK-03, TASK-04, TASK-05, TASK-07 |
| [TASK-11](./TASK-11-evidence-recommendation-engine.md) | Evidence & Recommendation Engine | Backend | TASK-04, TASK-07, TASK-06 |
| [TASK-13](./TASK-13-safety-privacy-governance.md) | Safety, Privacy & Governance | Cross-Cutting | TASK-03, TASK-08 |
| [TASK-01](./TASK-01-windows-client-kiosk-app.md) | Windows Client (Kiosk App) | Client | TASK-03, TASK-05 |
| [TASK-02](./TASK-02-learning-workspace-ui.md) | Learning Workspace UI (Student) | Client/Frontend | TASK-01, TASK-05, TASK-08 |
| [TASK-09](./TASK-09-mentor-dashboard.md) | Mentor Dashboard | Frontend | TASK-03, TASK-04, TASK-05, TASK-07, TASK-08 |
| [TASK-10](./TASK-10-parent-weekly-report.md) | Parent Weekly Report & Portal | Frontend | TASK-03, TASK-04, TASK-05 |
| [TASK-12](./TASK-12-admin-panel.md) | Admin Panel | Frontend | TASK-03, TASK-05 |

---

## Parallel Execution Waves

Because tasks have dependencies, they should be executed in waves. Teams or LLM agents working in parallel should follow these waves:

### Wave 1 — Foundation (All Other Waves Depend on This)
Run these first, in parallel where possible:
- **TASK-14**: Database schema and migrations (must complete first)

### Wave 2 — Core Backend (Run in Parallel After Wave 1)
- **TASK-03**: Auth & Identity Service
- **TASK-06**: Resource Intelligence Layer (can start with TASK-14 only)

### Wave 3 — Backend Services (Run in Parallel After Wave 2)
- **TASK-04**: Digital Twin (depends on TASK-03)
- **TASK-07**: Event Log Service (depends on TASK-03)
- **TASK-13**: Safety & Governance (depends on TASK-03)

### Wave 4 — Intelligence Layer (Run in Parallel After Wave 3)
- **TASK-05**: Core Services API (depends on TASK-04, TASK-06)
- **TASK-11**: Evidence & Recommendation Engine (depends on TASK-04, TASK-07)

### Wave 5 — AI & Integration (Run in Parallel After Wave 4)
- **TASK-08**: AI Learning Companion (depends on TASK-05, TASK-07, TASK-04)

### Wave 6 — All Frontends (Run in Parallel After Wave 4-5)
- **TASK-01**: Windows Client App
- **TASK-02**: Learning Workspace UI
- **TASK-09**: Mentor Dashboard
- **TASK-10**: Parent Report Portal
- **TASK-12**: Admin Panel

---

## Dependency Graph

```
TASK-14 (DB)
    │
    ├─→ TASK-03 (Auth) ──────────────────────────────────┐
    │       │                                             │
    │       ├─→ TASK-04 (Twin) ─────────────────────┐    │
    │       │       │                               │    │
    │       ├─→ TASK-07 (Events) ────────────────┐  │    │
    │       │       │                            │  │    │
    │       └─→ TASK-06 (Resources) ─────┐       │  │    │
    │                                    │       │  │    │
    │                                    ▼       ▼  ▼    │
    │                              TASK-05 (Core)        │
    │                                    │               │
    │                                    ▼               │
    │                              TASK-11 (Evidence)    │
    │                                    │               │
    │                                    ▼               │
    │                              TASK-08 (AI)          │
    │                                    │               │
    └────────────────────────────────────┘               │
                                                         │
         TASK-01 ──→ TASK-02 (Learner UI) ───────────────┤
         TASK-09 (Mentor Dashboard) ────────────────────-┤
         TASK-10 (Parent Report) ────────────────────────┤
         TASK-12 (Admin Panel) ──────────────────────────┘
```

---

## Technology Stack Decisions (MVP)

| Component | Technology | Rationale |
|-----------|-----------|----------|
| **Database** | PostgreSQL 15 | As specified in product doc; event-log design; JSONB for flexible payloads |
| **Backend API** | Node.js (Express/Fastify) or Python (FastAPI) | Team's choice; both work well with PostgreSQL |
| **Learning Client (all platforms)** | **Flutter (Dart)** | Single codebase for macOS + Windows + iOS; pixel-perfect UI; `window_manager` for desktop kiosk |
| **macOS Kiosk (Phase 1)** | ASAM via MDM (Apple Configurator 2 free / Jamf School) + `NSApp.presentationOptions` | macOS is Phase 1 MVP; Configurator 2 is free for pilot scale |
| **Windows Kiosk (Phase 2)** | Windows Assigned Access + `window_manager` | Built-in OS feature; no MDM needed; Phase 2 after macOS proven |
| **iOS Kiosk (Phase 2–3)** | MDM Single App Mode (Mosyle free ≤30 devices / Jamf School) | Apple’s gold standard; survives reboots; no app code needed |
| **Mentor/Parent/Admin Dashboards** | React (web) | Browser-based dashboards for mentor and admin roles |
| **Authentication** | JWT + Refresh Tokens | Stateless; OAuth/OIDC ready |
| **AI Provider** | OpenAI GPT-4o or Google Gemini Pro | Provider-agnostic gateway |
| **Local Dev** | Docker Compose | PostgreSQL + backend services |
| **Email** | Nodemailer / SendGrid | Weekly parent reports |

---

## Mock Data Strategy

All tasks are designed to work with **mock data** in the MVP phase, without requiring a production database or real provider integrations.

- All mock data is seeded via **TASK-14** (database seed script)
- Each task has a **Mock Data** section with the JSON structures to use
- Frontend tasks can import mock data from `src/mock/` folder during development
- The AI Companion has a **mock mode** that returns hardcoded responses without an API key
- Khan Academy resources use **deep links only** (no scraping, no API in MVP)

### How to Use Mock Data Without a Backend

For pure frontend development (TASK-02, TASK-09, TASK-10, TASK-12):
1. Create `src/mock/session.json`, `src/mock/twin.json`, etc.
2. Replace API calls with: `import mockData from '../mock/session.json'`
3. Add a `USE_MOCK=true` environment variable to toggle between mock and real API

---

## Validation Metrics (from Product Document)

Once the MVP is live with real learners, measure:

| Metric Group | Measures |
|-------------|---------|
| **Learning outcomes** | Pre/post diagnostic growth; topic mastery; delayed retention checks |
| **Engagement** | Attendance, completed sessions, productive time, voluntary help-seeking |
| **Mentor leverage** | Time-to-help, escalations per mentor, unresolved issue rate |
| **Parent trust** | Report engagement, satisfaction, renewal intent, qualitative feedback |
| **Unit economics** | Cost per learner-session, AI cost, mentor hours, device utilisation |
| **Safety & quality** | Escalation incidents, content accuracy, data-access events, response times |

---

## Key Risks & Mitigations (from Product Document)

| Risk | Mitigation | Relevant Tasks |
|------|-----------|---------------|
| Overbuilding before evidence | Use a narrow cohort, MVP scope and predefined pilot gates | All tasks (MVP scope discipline) |
| Content licensing constraints | Use approved methods, retain attribution, provider-agnostic catalogue | TASK-06 |
| AI inaccuracy or poor tutoring | Ground responses in approved context, test/evaluate, bounded tools, escalate | TASK-08, TASK-13 |
| Weak learning science | Bring curriculum expertise into decisions from the start | TASK-11 |
| Parent / teacher trust gap | Position AI as mentor multiplier; clear evidence, human escalation | TASK-09, TASK-10 |
| Child-data and safety risk | Data minimisation, consent, access controls, age-safe policies | TASK-13 |
| Centre economics | Measure device use, mentor workload, AI cost from first cohort | TASK-07, TASK-12 |

---

## MVP Definition of Done

The MVP is complete when:
1. A learner can log in on a Windows device → receive a session plan → work through resources → get AI support → have a mentor notified on escalation
2. A mentor can view the escalation queue, attend to a learner, and add a note
3. A parent can log in and see a plain-language weekly report
4. An admin can create users, register devices, and view centre metrics
5. All actions are logged to the audit trail
6. Safety filters are active on all AI responses
7. The system runs cleanly with mock data for 3 learners, 1 mentor, 1 parent, 1 admin

---

## File Structure Suggestion

```
learnos/
├── tasks/                          ← This directory (all task MD files)
│   ├── README.md                   ← This file
│   ├── TASK-01-windows-client-kiosk-app.md
│   ├── TASK-02-learning-workspace-ui.md
│   ├── TASK-03-auth-identity-service.md
│   ├── TASK-04-digital-twin-learner-model.md
│   ├── TASK-05-core-services-api.md
│   ├── TASK-06-resource-intelligence-layer.md
│   ├── TASK-07-event-log-telemetry-service.md
│   ├── TASK-08-ai-learning-companion.md
│   ├── TASK-09-mentor-dashboard.md
│   ├── TASK-10-parent-weekly-report.md
│   ├── TASK-11-evidence-recommendation-engine.md
│   ├── TASK-12-admin-panel.md
│   ├── TASK-13-safety-privacy-governance.md
│   └── TASK-14-database-schema-migrations.md
├── learnos_client/                 ← Flutter cross-platform app (Windows + macOS + iOS)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app.dart
│   │   ├── platform/           ← windows_kiosk.dart, macos_kiosk.dart, ios_kiosk.dart
│   │   ├── features/           ← auth, session, workspace, ai_companion, tools, reflection
│   │   ├── data/               ← api, mock, local (Hive)
│   │   └── core/               ← auth, events, theme
│   ├── windows/
│   ├── macos/
│   ├── ios/
│   └── pubspec.yaml
├── backend/                        ← Node.js or Python backend API
│   ├── migrations/
│   ├── src/
│   │   ├── auth/
│   │   ├── twin/
│   │   ├── sessions/
│   │   ├── resources/
│   │   ├── events/
│   │   ├── ai/
│   │   ├── evidence/
│   │   └── reports/
│   └── seed/
├── web/
│   ├── mentor/                     ← Mentor Dashboard (React)
│   ├── parent/                     ← Parent Portal (React)
│   └── admin/                      ← Admin Panel (React)
└── docker-compose.dev.yml
```

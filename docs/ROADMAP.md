# LearnOS Digital Twin — Phased Delivery Roadmap

This roadmap reconciles the full [`DigitalTwin.md`](./DigitalTwin.md) vision with
what LearnOS should actually **ship first**. It maps every specification section
to one of three milestones (v1 / v2 / v3), and links each to the concrete task
files in [`../tasks/`](../tasks/) and the backend code that already exists.

**Guiding principle:** do not build the whole specification in Version 1. Get a
focused learning + mentor-escalation loop into learners' hands for the 30–100
learner centre MVP, then evolve the Twin on real evidence — not assumption.

---

## Why phase it

The specification describes a mature intelligence engine (14 sub-twins,
prediction, motivation modelling, misconception tracking, career projection).
Shipping all of it at once carries three risks the LearnOS product doc already
calls out:

- **Overbuilding before evidence.** Many sub-twins (Motivation, Prediction,
  Misconception) need real learner data to calibrate. Building them before that
  data exists means guessing at models we will have to rewrite.
- **Explainability debt.** Every conclusion must be traceable. Prediction and
  motivation models are the hardest to keep explainable; they belong last, on
  top of a solid evidence base.
- **Time to first cohort.** A v1 that logs evidence and drives a rule-based
  "Today's Mission" can run a real pilot in ~8–10 weeks. That pilot generates
  the data v2 and v3 depend on.

The three milestones below are cumulative — each builds on the previous one and
never discards it (Core Principle: *never lose historical data*).

---

## Milestone map (spec section → milestone)

| Spec § | Component | v1 | v2 | v3 |
|-------:|-----------|:--:|:--:|:--:|
| 5 | Identity Layer | ● | | |
| 6 | Academic Twin (mastery, attempts, time, confidence prompt) | ● | | |
| 14 | Evidence Twin (session events) | ● | | |
| 19 | Session History | ● | | |
| 16 | Mentor Insights (notes) | ● | | |
| 17 | Parent Insights (basic) | ● | | |
| 18 | Portfolio (basic items) | ● | | |
| 22 | Recommendation Engine — rule-based *Today's Mission* | ● | | |
| 24 | Update Pipeline (evidence → twin → recommendation) | ● | | |
| 25 | Privacy, consent, explainability | ● | ● | ● |
| 26 | Core APIs (GetStudentTwin, UpdateMastery, AddEvidence, …) | ● | | |
| 7 | Competency Twin (Digital/Professional/Personal tracks) | | ● | |
| 8 | Knowledge Graph (prerequisite tracing) | ◐ | ● | |
| 9 | Learning Behaviour Twin | | ● | |
| 10 | Learning Preferences (evolving) | ◐ | ● | |
| 11 | Confidence Twin (confidence vs mastery divergence) | ◐ | ● | |
| 13 | Misconception Twin | | ● | |
| 15 | AI Memory (conversation recall) | | ● | |
| 20 | Resource Intelligence (effectiveness ranking) | | ● | |
| 21 | AI Intervention History | ◐ | ● | |
| 12 | Motivation Twin | | | ● |
| 23 | Prediction Engine (readiness, decay, burnout, velocity) | | | ● |
| 27 | Future Expansion (Career/University/Workplace/Wearables) | | | ● |

Legend: **●** delivered in that milestone · **◐** partial/foundation laid.

---

## Milestone v1 — Evidence-Backed Core (target: 8–10 weeks)

**Goal:** a learner logs in, gets a session plan, works through approved
resources, the Twin captures evidence, and a rule-based engine produces the next
recommendation. Mentors add notes; parents see a weekly report.

**Delivers spec §§:** 5, 6, 14, 16, 17 (basic), 18 (basic), 19, 22 (rule-based),
24, 25, 26.

**Tasks:**
- [TASK-14](../tasks/TASK-14-database-schema-migrations.md) — DB schema & migrations
- [TASK-03](../tasks/TASK-03-auth-identity-service.md) — Auth & Identity → *Identity Layer (§5)*
- [TASK-04](../tasks/TASK-04-digital-twin-learner-model.md) — Digital Twin store → *Academic Twin, Evidence, Session History, Mentor Notes (§§6, 14, 16, 19)*
- [TASK-07](../tasks/TASK-07-event-log-telemetry-service.md) — Event Log → *Evidence Twin, Update Pipeline (§§14, 24)*
- [TASK-05](../tasks/TASK-05-core-services-api.md) — Sessions & Plans → *Today's Mission (§22)*
- [TASK-06](../tasks/TASK-06-resource-intelligence-layer.md) — Resource catalogue (deep links) → foundation for *Resource Intelligence (§20)*
- [TASK-11](../tasks/TASK-11-evidence-recommendation-engine.md) — Evidence + **rule-based** recommendation → *Recommendation Engine (§22)*
- [TASK-08](../tasks/TASK-08-ai-learning-companion.md) — AI Companion (explain/ask/check + escalate)
- [TASK-13](../tasks/TASK-13-safety-privacy-governance.md) — Privacy, consent, explainability → *§25*
- [TASK-09](../tasks/TASK-09-mentor-dashboard.md) / [TASK-10](../tasks/TASK-10-parent-weekly-report.md) / [TASK-12](../tasks/TASK-12-admin-panel.md) / [TASK-01](../tasks/TASK-01-windows-client-kiosk-app.md) / [TASK-02](../tasks/TASK-02-learning-workspace-ui.md) — surfaces

**Already scaffolded in this repo (`backend/src/`):**
`twin.service`, `event.service`, `session.service`, `recommendation.service`,
`escalation.service`, `ai.service`, `safety.service`, `report.service`,
`resource.service`, `auth.service`, with matching controllers, routes, tests
(`twin.test`, `event.test`, `wave3.test`, `wave4.test`) and `seed/seed_mvp.sql`.
v1 is largely about hardening and integrating these, not greenfield build.

**Explicitly deferred out of v1** (per the spec's own §30 and `tasks/README.md`):
ML-driven mastery, prediction, motivation modelling, misconception detection,
hundreds of behavioural variables, biometric/ambient data.

**v1 Definition of Done:** the seven-point MVP DoD in
[`tasks/README.md`](../tasks/README.md) is met with mock data for a small cohort,
every learner conclusion is traceable to events, and safety filters run on all AI
responses.

---

## Milestone v2 — Adaptive Twin

**Goal:** the Twin starts personalizing *how* content is delivered and *why*
learners struggle, using the evidence v1 has been accumulating.

**Delivers spec §§:** 7, 8 (full prerequisite tracing), 9, 10, 11, 13, 15, 20, 21.

**Work items (new tasks to author):**
- **Competency Twin (§7):** extend the competency catalogue beyond Academic into
  Digital / Professional / Personal tracks with Current/Target levels + evidence.
- **Knowledge Graph (§8):** promote `competencies.prerequisite_ids` (already in
  the TASK-04 schema) into a first-class graph the recommender traces backward on
  a weak topic.
- **Learning Behaviour Twin (§9)** and **evolving Learning Preferences (§10):**
  derive metrics from the v1 event stream (session length, focus, hint usage,
  video completion) — no new capture surface required, just aggregation.
- **Confidence Twin (§11):** flag confidence-vs-mastery divergence (high mastery /
  low confidence → reinforce; low mastery / high confidence → guard against
  guessing). Builds directly on v1's `learner_confidence` + `mastery_score`.
- **Misconception Twin (§13):** cluster recurring incorrect-answer patterns into
  named misconceptions with occurrence counts and resolved/unresolved status.
- **AI Memory (§15):** persist companion conversation summaries so explanations
  and analogies are not repeated.
- **Resource Intelligence (§20)** + **AI Intervention History (§21):** rank which
  resource / intervention actually moved mastery, per topic.

**Precondition:** v1 has been live long enough to produce statistically useful
evidence volume. Do not start behaviour/confidence modelling before then.

---

## Milestone v3 — Predictive & Lifelong Twin

**Goal:** the Twin looks forward — predicting needs and risks — and extends beyond
the academic centre into lifelong competency.

**Delivers spec §§:** 12, 23, 27.

**Work items (new tasks to author):**
- **Prediction Engine (§23):** exam readiness, revision need, concept decay,
  burnout risk, confidence drop, mentor-intervention timing, learning velocity —
  every prediction **probabilistic and explainable**, never an opaque score.
- **Motivation Twin (§12):** model motivation drivers and let the AI personalize
  encouragement; opt-in and privacy-guarded.
- **Future Expansion (§27):** Career recommendation, University readiness,
  Workplace competency tracking, and (opt-in only) wearable / eye-tracking /
  voice-emotion / handwriting signals.

**Hard gates before any v3 work:**
1. Explainability: every prediction traces to the evidence behind it (§25).
2. Consent: sensitive/wellbeing and biometric signals are optional and opt-in.
3. Evidence sufficiency: models are calibrated on real cohort data from v1–v2,
   not synthetic assumptions.

---

## How to proceed (next actions)

1. **Adopt this phasing** — treat `tasks/` as the v1 backlog (it already encodes
   the deliberately-small MVP) and this roadmap as the milestone frame around it.
2. **Finish v1** — harden the backend services already scaffolded, close each
   TASK's acceptance criteria, and hit the MVP Definition of Done in
   `tasks/README.md`.
3. **Run the pilot** — put v1 in front of the 30–100 learner cohort and collect
   evidence. This is the input v2 depends on.
4. **Author v2 tasks** — when evidence volume is sufficient, write `TASK-15…` for
   the v2 work items above, following the same task-file format.
5. **Gate v3** — only begin prediction/motivation work once the three v3 gates
   (explainability, consent, evidence sufficiency) are demonstrably met.

Nothing in the full specification is dropped — it is sequenced. v1 ships value in
weeks; v2 and v3 layer on top without rewriting the evidence core.

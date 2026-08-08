# TASK-10: Parent Weekly Report — Family Visibility & Communication

## Overview
Build the **Parent Weekly Report** — a plain-language progress summary delivered to parents/guardians on a weekly basis. Parents should understand what their child learned, how they're progressing, and what the next steps are — without needing to interpret scores or jargon.

## Context (from LearnOS Product Document)
> "Every parent should understand growth without relying on a single mark or black-box score."
> "Tests communication quality and willingness and pay" (validation metric)
> "Report engagement, satisfaction, renewal intent, qualitative feedback" (pilot measure for Parent Trust)
> "Parent weekly report" (listed as MVP deliverable)

---

## What Parents Need to See

The document explicitly states: "Plain-language progress, goals and next steps."

**Not:** "Ahmed scored 72% on assessment item C4.3.b"
**But:** "Ahmed is getting confident with basic fractions and has just started learning about equivalent fractions. He'll be practising this more next week."

---

## Report Content Structure

### Weekly Report Sections

#### 1. Header
- Learner name + photo placeholder
- Week dates (e.g., "Week of 21–27 July 2026")
- LearnOS centre name
- Report generated on date

#### 2. This Week at a Glance
Simple metrics, human-readable:
```
📅 Sessions attended: 4 of 5 planned
⏱️  Total learning time: 3 hours 20 minutes
📚 Topics covered: Basic Fractions, Equivalent Fractions
✅ Tasks completed: 14 of 16
🤝 Mentor check-ins: 2
```

#### 3. What Ahmed Learned This Week
A 2–3 sentence plain-language summary (AI-generated, mentor-reviewed):
> "Ahmed continued building his understanding of fractions this week. He completed his review of basic fractions and made a great start on equivalent fractions. He needed a bit of extra support from his mentor on Wednesday, and that really helped him get unstuck."

#### 4. Progress by Topic (Visual)
A simple progress bar or badge display per topic covered this week:

| Topic | Progress | Status |
|-------|----------|--------|
| Basic Fractions | ████████░░ 80% | Developing well |
| Equivalent Fractions | ███░░░░░░░ 30% | Just started |

**Design rule:** Show mastery level in plain language, not raw scores:
- not_started → "Not yet started"
- emerging → "Just started"
- developing → "Making progress"
- proficient → "Doing well"
- mastered → "Confidently knows this"

#### 5. What's Coming Next Week
Next 1–3 planned topics:
> "Next week, Ahmed will continue practising equivalent fractions and then move on to adding fractions with the same denominator."

#### 6. Your Child's Confidence
The learner's self-reported confidence from session reflections:
> "At the end of each session, Ahmed tells us how confident he feels. This week he reported feeling 3 out of 5 on equivalent fractions — which is exactly what we'd expect at this stage."

#### 7. Mentor Note (Optional — if mentor added a parent-facing note)
> "Ahmed worked really hard this week and asked great questions! He's been putting in the effort — keep encouraging him at home. — Ms. Nadia"

#### 8. A Suggested Question to Ask at Home
One simple, curiosity-provoking prompt:
> "You could ask Ahmed: 'Can you show me two fractions that are the same amount?'"

#### 9. Footer
- Attendance summary for the term
- "Questions? Contact us" (centre contact info)
- "View full session history" link (future — parent portal)
- Unsubscribe / preference management link

---

## Delivery Methods (MVP)

1. **Web view**: Parent logs in to parent portal → sees latest report
2. **Email**: Simple HTML email sent every Monday for the previous week (or on demand)
3. **Future**: WhatsApp/SMS notification with link to full report

---

## Parent Portal Screens

### 1. Parent Login
- Email + password
- Show child's name on login confirmation ("Welcome back! You're viewing reports for Ahmed Khan.")

### 2. Latest Weekly Report
- Full report as described above
- "Download as PDF" button

### 3. Report History
- List of past reports (one per week)
- Click to view any past report

### 4. Child's Progress Overview (Simple)
- All topics studied this term with current mastery level (plain language)
- Session attendance calendar (week view showing attended/missed)

---

## API Endpoints

### Report Generation (Internal / Admin)
```
POST /reports/weekly/generate?learner_id=...&week=2026-W30
  -- Generates or regenerates report for a learner for the given week
  -- Uses session events, Twin data, and mentor notes from that week
```

### Report Read (Parent-Facing)
```
GET /reports/weekly?learner_id=...&week=2026-W30   -- Get report for specific week
GET /reports/weekly/latest?learner_id=...           -- Get most recent report
GET /reports/weekly/list?learner_id=...             -- List all available weekly reports
```

### Email Delivery (Internal)
```
POST /reports/weekly/send-email?learner_id=...&week=2026-W30
  -- Triggers email to parent on file
```

---

## Database Schema

```sql
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL,
  week_label VARCHAR(20) NOT NULL,       -- e.g., '2026-W30'
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft','ready','sent')),

  -- Report content (JSON for flexibility)
  report_data JSONB NOT NULL,            -- Full structured report content

  -- Delivery tracking
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,                 -- Web view
  parent_feedback VARCHAR(50),           -- 'satisfied', 'neutral', 'concerned' (future)

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  mentor_reviewed BOOLEAN DEFAULT false,
  mentor_reviewed_at TIMESTAMPTZ,
  mentor_reviewer_id UUID REFERENCES users(id)
);
```

---

## Report Generation Algorithm (MVP: Rule-Based)

```
function generateWeeklyReport(learner_id, week):
  1. Get all sessions for learner in this week
  2. Aggregate session metrics:
     - sessions_planned (from learning plan)
     - sessions_attended (status = 'completed')
     - total_duration_min (sum of ended_at - started_at)
     - tasks_completed (count)
     - tasks_total (count)
     - mentor_escalations (count from escalations table)
  3. Get competencies practiced (from session events, group by competency_id)
  4. For each competency: get current mastery level from Twin
  5. Get learner confidence scores from reflection events
  6. Get mentor notes marked as parent-visible from this week
  7. Get next_week plan from learning plan (next 2–3 learning_plan_items)
  8. Generate summary text:
     - MVP: Use template strings
     - Production: Use AI to generate natural language summary
  9. Generate "question to ask at home" from current topic
  10. Assemble report_data JSON
  11. Set status = 'ready'; notify parent
```

---

## Mock Report Data (MVP Seed)

```json
{
  "learner_id": "learner-001",
  "learner_name": "Ahmed Khan",
  "week_label": "2026-W30",
  "week_start": "2026-07-21",
  "week_end": "2026-07-27",

  "glance": {
    "sessions_attended": 4,
    "sessions_planned": 5,
    "total_learning_time_min": 200,
    "topics_covered": ["Basic Fractions", "Equivalent Fractions"],
    "tasks_completed": 14,
    "tasks_total": 16,
    "mentor_check_ins": 2
  },

  "summary_text": "Ahmed continued building his understanding of fractions this week. He completed his review of basic fractions and made a great start on equivalent fractions. He needed a bit of extra support from his mentor on Wednesday, and that really helped him get unstuck.",

  "topics": [
    {
      "topic": "Basic Fractions",
      "mastery_level": "developing",
      "mastery_label": "Making progress",
      "mastery_percent": 78
    },
    {
      "topic": "Equivalent Fractions",
      "mastery_level": "emerging",
      "mastery_label": "Just started",
      "mastery_percent": 30
    }
  ],

  "confidence_summary": {
    "average_score": 3.2,
    "scale": 5,
    "text": "Ahmed reported feeling 3 out of 5 confident on equivalent fractions — which is exactly right for this stage."
  },

  "next_week_topics": ["Equivalent Fractions (continued)", "Adding Fractions (same denominator)"],

  "mentor_note": "Ahmed worked really hard this week and asked great questions! — Ms. Nadia",

  "question_for_home": "Can you ask Ahmed: 'Can you show me two fractions that are the same amount?'"
}
```

---

## Email Template (HTML)

The report should be rendered as a clean, mobile-friendly HTML email:
- LearnOS logo
- Learner name and week
- "At a Glance" section with icons and numbers
- Topic progress bars (use simple table-based CSS, not flexbox — email compatibility)
- Summary text
- Mentor note (if present)
- Question to ask
- Footer with centre contact

---

## Acceptance Criteria

- [ ] `GET /reports/weekly/latest?learner_id=learner-001` returns a valid report
- [ ] Report contains all 8 sections (glance, summary, topics, confidence, next week, mentor note, question, footer)
- [ ] Mastery levels are shown in plain language (not raw scores)
- [ ] Parent portal login works with parent credentials
- [ ] Parent sees only their child's report (RBAC enforced)
- [ ] Report history lists past reports
- [ ] Email can be triggered and renders correctly (test with Mailtrap or similar)
- [ ] Mock report data is pre-seeded for `learner-001` for week 2026-W30

---

## Dependencies
- **TASK-03**: Auth (parent JWT)
- **TASK-04**: Digital Twin (competency mastery states)
- **TASK-05**: Core Services API (session data, attendance)
- **TASK-07**: Event Log (session evidence for summary)
- **TASK-09**: Mentor Dashboard (mentor notes for parent-visible notes)

---

## Notes for LLM Agent
- Parent portal is a separate web app or subdomain from mentor dashboard
- Report text in MVP can be template-string generated — no AI needed for text generation in Phase 1
- Email delivery: use Nodemailer or SendGrid in Node; or smtplib in Python
- Strictly enforce parent can only see their own child's data
- Report PDF export: use puppeteer or wkhtmltopdf to render HTML → PDF
- Plain language is paramount — no education jargon in parent-facing text

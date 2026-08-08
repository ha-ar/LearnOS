// ─── Parent Portal Mock Data ──────────────────────────────────────────────────
// Matches TASK-10 specification & backend report.service.ts shape.

export const MOCK_PARENT_DATA = {
  parent_user: {
    name: 'Tariq Khan',
    email: 'parent@pilot.learnos',
    role: 'parent',
    child_name: 'Ahmed Khan',
    child_id: 'learner-001',
    child_grade: 'Grade 6',
  },

  latest_report: {
    id: 'rep-2026-w30',
    learner_id: 'learner-001',
    learner_name: 'Ahmed Khan',
    week_label: '2026-W30',
    week_start: '2026-07-21',
    week_end: '2026-07-27',
    centre_name: 'LearnOS Pilot Learning Centre',
    generated_at: '2026-07-27T18:00:00Z',

    // Section 2: This Week at a Glance
    glance: {
      sessions_attended: 4,
      sessions_planned: 5,
      total_learning_time_min: 200,
      topics_covered: ['Basic Fractions', 'Equivalent Fractions'],
      tasks_completed: 14,
      tasks_total: 16,
      mentor_check_ins: 2,
    },

    // Section 3: Narrative Plain-Language Summary
    summary_text:
      'Ahmed continued building his understanding of fractions this week. He completed his review of basic fractions and made a great start on equivalent fractions. He needed a bit of extra support from his mentor on Wednesday, and that really helped him get unstuck.',

    // Section 4: Progress by Topic
    topics: [
      {
        topic: 'Basic Fractions',
        mastery_level: 'developing',
        mastery_label: 'Making progress',
        mastery_percent: 78,
      },
      {
        topic: 'Equivalent Fractions',
        mastery_level: 'emerging',
        mastery_label: 'Just started',
        mastery_percent: 30,
      },
    ],

    // Section 6: Child's Confidence
    confidence_summary: {
      average_score: 3.2,
      scale: 5,
      text: 'Ahmed reported feeling 3 out of 5 confident on equivalent fractions — which is exactly right for this stage.',
    },

    // Section 5: Next Week Topics
    next_week_topics: [
      'Equivalent Fractions (continued practice)',
      'Adding Fractions with the same denominator',
    ],

    // Section 7: Mentor Note
    mentor_note:
      "Ahmed worked really hard this week and asked great questions! He's been putting in real effort — keep encouraging him at home. — Ms. Nadia",

    // Section 8: Home Question Prompt
    question_for_home:
      "Can you ask Ahmed: 'Can you show me two fractions that are the same amount?'",

    // Email Delivery Status
    email_status: {
      sent: true,
      sent_at: '2026-07-27T18:05:00Z',
      recipient: 'parent@pilot.learnos',
    },
  },

  past_reports: [
    {
      id: 'rep-2026-w30',
      week_label: '2026-W30',
      week_start: '2026-07-21',
      week_end: '2026-07-27',
      sessions_attended: 4,
      sessions_planned: 5,
      main_topic: 'Equivalent Fractions',
      status: 'ready',
    },
    {
      id: 'rep-2026-w29',
      week_label: '2026-W29',
      week_start: '2026-07-14',
      week_end: '2026-07-20',
      sessions_attended: 5,
      sessions_planned: 5,
      main_topic: 'Basic Fractions',
      status: 'ready',
    },
    {
      id: 'rep-2026-w28',
      week_label: '2026-W28',
      week_start: '2026-07-07',
      week_end: '2026-07-13',
      sessions_attended: 4,
      sessions_planned: 5,
      main_topic: 'Intro to Fractions & Numerators',
      status: 'ready',
    },
  ],

  term_overview: {
    term: 'Summer Term 2026',
    total_sessions_attended: 13,
    total_sessions_planned: 15,
    attendance_rate: '87%',
    competencies: [
      { topic: 'Understanding Numerators & Denominators', mastery_level: 'proficient', mastery_label: 'Doing well', mastery_percent: 92 },
      { topic: 'Basic Fractions Review',                 mastery_level: 'developing', mastery_label: 'Making progress', mastery_percent: 78 },
      { topic: 'Equivalent Fractions',                    mastery_level: 'emerging',   mastery_label: 'Just started', mastery_percent: 30 },
      { topic: 'Adding Fractions',                        mastery_level: 'not_started',mastery_label: 'Not yet started', mastery_percent: 0 },
      { topic: 'Mixed Numbers & Improper Fractions',     mastery_level: 'not_started',mastery_label: 'Not yet started', mastery_percent: 0 },
    ],
    attendance_calendar: [
      { week: 'Week 1 (July 7)',  days: ['P', 'P', 'P', 'P', 'A'] },
      { week: 'Week 2 (July 14)', days: ['P', 'P', 'P', 'P', 'P'] },
      { week: 'Week 3 (July 21)', days: ['P', 'P', 'P', 'P', 'A'] },
    ],
  },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────
// All mock responses mirror the real API shape exactly.
// Toggle: set VITE_USE_MOCK=true in .env.local

const now = Date.now();

export const MOCK_DATA = {
  // GET /api/mentor/dashboard
  dashboard: {
    pending_escalations: 1,
    session_started_at: new Date(now - 40 * 60 * 1000).toISOString(),
    last_updated: new Date().toISOString(),
    learners: [
      {
        id: 'learner-001',
        name: 'Ahmed Khan',
        grade: 'Grade 6',
        status: 'on_track',
        current_task: 'Equivalent Fractions — Video Lesson',
        current_topic: 'Equivalent Fractions',
        time_in_session_min: 22,
        ai_interactions: 3,
        escalation_id: null,
      },
      {
        id: 'learner-002',
        name: 'Sara Malik',
        grade: 'Grade 6',
        status: 'needs_help',
        current_task: 'Basic Fractions (Practice)',
        current_topic: 'Basic Fractions',
        time_in_session_min: 35,
        ai_interactions: 6,
        escalation_id: 'esc-001',
      },
      {
        id: 'learner-003',
        name: 'Omar Farooq',
        grade: 'Grade 6',
        status: 'slow_progress',
        current_task: 'Algebra Intro (Learn)',
        current_topic: 'Basic Algebra',
        time_in_session_min: 18,
        ai_interactions: 1,
        escalation_id: null,
      },
    ],
  },

  // GET /api/mentor/escalations
  escalations: [
    {
      id: 'esc-001',
      learner_id: 'learner-002',
      learner_name: 'Sara Malik',
      learner_grade: 'Grade 6',
      competency: 'Basic Fractions',
      trigger_type: 'ai_suggested',
      brief_text:
        "Sara has answered 3/5 check questions incorrectly and clicked 'I'm stuck' twice. Two AI explanations were tried. The concept may require hands-on intervention.",
      evidence_snapshot: {
        incorrect_answers: 3,
        hints_requested: 2,
        ai_explanations_given: 2,
        time_stuck_min: 12,
      },
      ai_suggested_approach:
        'Try a worked example using physical objects or drawing fractions on paper.',
      status: 'pending',
      created_at: new Date(now - 2 * 60 * 1000).toISOString(),
    },
  ],

  // GET /api/mentor/learners/:id
  learner_detail: {
    'learner-001': {
      learner: {
        id: 'learner-001',
        name: 'Ahmed Khan',
        grade: 'Grade 6',
        email: 'ahmed@pilot.learnos',
        status: 'on_track',
        current_task: 'Equivalent Fractions — Video Lesson',
        ai_interactions: 3,
        time_in_session_min: 22,
      },
      competencies: [
        { id: 'c1', name: 'Basic Fractions',       mastery: 'developing',  last_practiced: '2026-07-21' },
        { id: 'c2', name: 'Equivalent Fractions',   mastery: 'emerging',    last_practiced: '2026-07-22' },
        { id: 'c3', name: 'Simplifying Fractions',  mastery: 'not_started', last_practiced: null },
        { id: 'c4', name: 'Adding Fractions',        mastery: 'not_started', last_practiced: null },
        { id: 'c5', name: 'Mixed Numbers',           mastery: 'not_started', last_practiced: null },
      ],
      sessions: [
        { id: 's1', date: '2026-07-22', topic: 'Equivalent Fractions', completed_tasks: 2, total_tasks: 4, outcome: 'In Progress' },
        { id: 's2', date: '2026-07-21', topic: 'Basic Fractions',      completed_tasks: 4, total_tasks: 4, outcome: 'Completed' },
        { id: 's3', date: '2026-07-20', topic: 'Intro to Fractions',   completed_tasks: 4, total_tasks: 4, outcome: 'Completed' },
      ],
      goals: [{ id: 'g1', text: 'Complete Fractions unit by end of July', status: 'active' }],
    },
    'learner-002': {
      learner: {
        id: 'learner-002',
        name: 'Sara Malik',
        grade: 'Grade 6',
        email: 'sara@pilot.learnos',
        status: 'needs_help',
        current_task: 'Basic Fractions (Practice)',
        ai_interactions: 6,
        time_in_session_min: 35,
      },
      competencies: [
        { id: 'c1', name: 'Basic Fractions',       mastery: 'emerging',    last_practiced: '2026-07-22' },
        { id: 'c2', name: 'Equivalent Fractions',   mastery: 'not_started', last_practiced: null },
        { id: 'c3', name: 'Simplifying Fractions',  mastery: 'not_started', last_practiced: null },
      ],
      sessions: [
        { id: 's1', date: '2026-07-22', topic: 'Basic Fractions', completed_tasks: 1, total_tasks: 4, outcome: 'In Progress' },
        { id: 's2', date: '2026-07-21', topic: 'Intro to Fractions', completed_tasks: 3, total_tasks: 4, outcome: 'Partial' },
      ],
      goals: [{ id: 'g1', text: 'Understand fractions concept with confidence', status: 'active' }],
    },
    'learner-003': {
      learner: {
        id: 'learner-003',
        name: 'Omar Farooq',
        grade: 'Grade 6',
        email: 'omar@pilot.learnos',
        status: 'slow_progress',
        current_task: 'Algebra Intro (Learn)',
        ai_interactions: 1,
        time_in_session_min: 18,
      },
      competencies: [
        { id: 'c1', name: 'Variables & Expressions', mastery: 'emerging',    last_practiced: '2026-07-22' },
        { id: 'c2', name: 'Simple Equations',         mastery: 'not_started', last_practiced: null },
      ],
      sessions: [
        { id: 's1', date: '2026-07-22', topic: 'Algebra Intro', completed_tasks: 1, total_tasks: 4, outcome: 'In Progress' },
      ],
      goals: [{ id: 'g1', text: 'Grasp algebra basics before term exam', status: 'active' }],
    },
  },

  // GET /api/mentor/learners/:id/session/today
  today_session: {
    session: { id: 's-001', date: '2026-07-22', topic: 'Equivalent Fractions' },
    tasks: [
      { id: 't1', title: 'Quick Review — Basic Fractions', status: 'completed' },
      { id: 't2', title: 'Equivalent Fractions — Video Lesson', status: 'active' },
      { id: 't3', title: 'Practice Quiz (5 Questions)', status: 'upcoming' },
      { id: 't4', title: 'Session Reflection', status: 'upcoming' },
    ],
    events: [
      { id: 'e1', type: 'task_started',  label: 'Started: Quick Review — Basic Fractions', time: '10:00 AM', color: 'info' },
      { id: 'e2', type: 'check_correct', label: '✅ Check question answered correctly',      time: '10:04 AM', color: 'success' },
      { id: 'e3', type: 'check_wrong',   label: '❌ Check question answered incorrectly',    time: '10:07 AM', color: 'danger' },
      { id: 'e4', type: 'ai_question',   label: '💬 AI: "Why do we multiply top and bottom?"', time: '10:09 AM', color: 'purple' },
      { id: 'e5', type: 'task_complete', label: '✅ Task completed: Quick Review',           time: '10:12 AM', color: 'success' },
      { id: 'e6', type: 'task_started',  label: 'Started: Equivalent Fractions Lesson',      time: '10:13 AM', color: 'info' },
      { id: 'e7', type: 'hint_requested',label: '⚠️ Hint requested by learner',              time: '10:18 AM', color: 'warning' },
      { id: 'e8', type: 'ai_question',   label: '💬 AI: "Can you give a worked example?"',  time: '10:20 AM', color: 'purple' },
    ],
    ai_interactions: 3,
    check_correct: 1,
    check_wrong: 1,
  },

  // GET /api/mentor/learners/:id/notes
  notes: {
    'learner-001': [
      {
        id: 'n1',
        learner_id: 'learner-001',
        note_type: 'Observation',
        competency: 'Basic Fractions',
        text: 'Ahmed grasped numerator/denominator quickly. Encourage harder problems next session.',
        created_at: '2026-07-21T09:30:00Z',
        mentor_name: 'Ms. Nadia',
      },
    ],
    'learner-002': [],
    'learner-003': [],
  },

  // GET /api/mentor/summary
  summary: {
    sessions_this_week: 12,
    escalations_handled: 3,
    avg_session_min: 38,
    top_struggles: [
      { topic: 'Equivalent Fractions', count: 5 },
      { topic: 'Basic Fractions',      count: 3 },
      { topic: 'Algebra Intro',        count: 2 },
    ],
    at_risk_learners: [],
  },
};

// In-memory mutation state for mock
let _escalations = [...MOCK_DATA.escalations];
let _notes = { ...MOCK_DATA.notes };

export function getMockEscalations() { return _escalations.filter(e => e.status !== 'dismissed'); }
export function attendMockEscalation(id) {
  _escalations = _escalations.map(e => e.id === id ? { ...e, status: 'attending' } : e);
  return _escalations.find(e => e.id === id);
}
export function resolveMockEscalation(id, outcome, note) {
  _escalations = _escalations.map(e => e.id === id ? { ...e, status: 'resolved', resolution_note: note } : e);
  MOCK_DATA.dashboard.pending_escalations = _escalations.filter(e => e.status === 'pending').length;
  const learner = MOCK_DATA.dashboard.learners.find(l => l.escalation_id === id);
  if (learner) { learner.status = 'on_track'; learner.escalation_id = null; }
  return _escalations.find(e => e.id === id);
}
export function dismissMockEscalation(id) {
  _escalations = _escalations.map(e => e.id === id ? { ...e, status: 'dismissed' } : e);
}
export function getMockNotes(learnerId) { return _notes[learnerId] ?? []; }
export function addMockNote(learnerId, note) {
  if (!_notes[learnerId]) _notes[learnerId] = [];
  const n = { id: `note-${Date.now()}`, learner_id: learnerId, ...note, created_at: new Date().toISOString(), mentor_name: 'Ms. Nadia' };
  _notes[learnerId] = [n, ..._notes[learnerId]];
  return n;
}

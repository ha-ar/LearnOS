import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://learnos:learnos_dev_password@localhost:5432/learnos_dev',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// In-Memory Pilot Store for Cloud Run / Unreachable DB fallback
const PILOT_PASS_HASH = '$2a$12$G.a//bmlDI3KMZQT1bqGEe6ZQvmr3DBFfpVmVjR2i/ToFtYqP5bAO'; // LearnOS2026!
const pilotUsersMap = new Map<string, any>([
  ['ahmed@pilot.learnos', {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'ahmed@pilot.learnos',
    password_hash: PILOT_PASS_HASH,
    name: 'Ahmed Khan',
    role: 'learner',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString()
  }],
  ['sara@pilot.learnos', {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'sara@pilot.learnos',
    password_hash: PILOT_PASS_HASH,
    name: 'Sara Malik',
    role: 'learner',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString()
  }],
  ['mentor@pilot.learnos', {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'mentor@pilot.learnos',
    password_hash: PILOT_PASS_HASH,
    name: 'Ms. Nadia',
    role: 'mentor',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString()
  }],
  ['parent@pilot.learnos', {
    id: '30000000-0000-0000-0000-000000000001',
    email: 'parent@pilot.learnos',
    password_hash: PILOT_PASS_HASH,
    name: 'Mr. Khan Sr.',
    role: 'parent',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString()
  }],
  ['admin@pilot.learnos', {
    id: '40000000-0000-0000-0000-000000000001',
    email: 'admin@pilot.learnos',
    password_hash: PILOT_PASS_HASH,
    name: 'Admin User',
    role: 'admin',
    tenant_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString()
  }],
]);

// In-Memory fallback store for session_events
const mockSessionId = 'session-mock-001';
const mockLearnerId = '10000000-0000-0000-0000-000000000001';
const mockTenantId = '00000000-0000-0000-0000-000000000001';
const mockCompId = 'c0000000-0000-0000-0000-000000000001';
const mockResId = 'b1000000-0000-0000-0000-000000000001';
const mockTaskId = 'b5000000-0000-0000-0000-000000000001';

const now = Date.now();
const minute = 60 * 1000;

interface MockEventInput {
  event_type: string;
  payload: Record<string, any>;
  minutes_ago: number;
  device_id?: string;
  resource_id?: string;
  competency_id?: string;
  task_id?: string;
  mentor_id?: string;
}

const rawMockEvents: MockEventInput[] = [
  { event_type: 'session_started', payload: { device_id: 'd1', platform: 'windows' }, minutes_ago: 45 },
  { event_type: 'task_started', task_id: mockTaskId, competency_id: mockCompId, payload: { task_title: 'Fractions Basics' }, minutes_ago: 44 },
  { event_type: 'resource_opened', resource_id: mockResId, task_id: mockTaskId, competency_id: mockCompId, payload: { title: 'Intro to Equivalent Fractions' }, minutes_ago: 43 },
  { event_type: 'video_paused', resource_id: mockResId, payload: { position_sec: 120 }, minutes_ago: 40 },
  { event_type: 'video_replayed', resource_id: mockResId, payload: { from_sec: 60, to_sec: 120 }, minutes_ago: 38 },
  { event_type: 'video_resumed', resource_id: mockResId, payload: { position_sec: 120 }, minutes_ago: 37 },
  { event_type: 'video_seeked', resource_id: mockResId, payload: { seek_to: 240 }, minutes_ago: 35 },
  { event_type: 'resource_retry', resource_id: mockResId, payload: { attempt: 2 }, minutes_ago: 33 },
  { event_type: 'hint_requested', resource_id: mockResId, competency_id: mockCompId, payload: { hint_num: 1 }, minutes_ago: 32 },
  { event_type: 'ai_question_asked', resource_id: mockResId, competency_id: mockCompId, payload: { question: 'Why multiply numerator and denominator?' }, minutes_ago: 30 },
  { event_type: 'ai_response_received', resource_id: mockResId, payload: { summary: 'Explained visual area model' }, minutes_ago: 29 },
  { event_type: 'ai_escalation_suggested', competency_id: mockCompId, payload: { reason: 'Repeated struggles with cross multiplication' }, minutes_ago: 28 },
  { event_type: 'check_started', competency_id: mockCompId, payload: { quiz_id: 'q-math-1' }, minutes_ago: 25 },
  { event_type: 'check_question_answered', competency_id: mockCompId, payload: { question_id: 'q1', answer: 'a', is_correct: false }, minutes_ago: 24 },
  { event_type: 'check_question_incorrect', competency_id: mockCompId, payload: { question_id: 'q1' }, minutes_ago: 24 },
  { event_type: 'check_question_answered', competency_id: mockCompId, payload: { question_id: 'q1', answer: 'b', is_correct: true }, minutes_ago: 22 },
  { event_type: 'check_question_correct', competency_id: mockCompId, payload: { question_id: 'q1' }, minutes_ago: 22 },
  { event_type: 'check_question_answered', competency_id: mockCompId, payload: { question_id: 'q2', answer: 'c', is_correct: true }, minutes_ago: 20 },
  { event_type: 'check_question_correct', competency_id: mockCompId, payload: { question_id: 'q2' }, minutes_ago: 20 },
  { event_type: 'check_completed', competency_id: mockCompId, payload: { score: 2, total: 3 }, minutes_ago: 19 },
  { event_type: 'resource_completed', resource_id: mockResId, competency_id: mockCompId, payload: { duration_sec: 600 }, minutes_ago: 18 },
  { event_type: 'task_completed', task_id: mockTaskId, competency_id: mockCompId, payload: { duration_sec: 1200 }, minutes_ago: 17 },
  { event_type: 'learner_stuck_flagged', competency_id: mockCompId, payload: { attempts: 3 }, minutes_ago: 15 },
  { event_type: 'mentor_escalation_requested', competency_id: mockCompId, payload: { trigger: 'learner_flagged' }, minutes_ago: 14 },
  { event_type: 'mentor_arrived', mentor_id: '20000000-0000-0000-0000-000000000001', payload: { mentor_name: 'Ms. Nadia' }, minutes_ago: 12 },
  { event_type: 'mentor_note_added', mentor_id: '20000000-0000-0000-0000-000000000001', payload: { note: 'Reviewed paper diagram together' }, minutes_ago: 10 },
  { event_type: 'mentor_escalation_resolved', mentor_id: '20000000-0000-0000-0000-000000000001', payload: { status: 'resolved' }, minutes_ago: 8 },
  { event_type: 'reflection_started', payload: { prompt: 'How confident do you feel?' }, minutes_ago: 6 },
  { event_type: 'confidence_reported', competency_id: mockCompId, payload: { confidence_score: 4, scale: 5 }, minutes_ago: 5 },
  { event_type: 'reflection_submitted', payload: { text: 'I understand equivalent fractions now.' }, minutes_ago: 4 },
  { event_type: 'device_heartbeat', payload: { battery_level: 95 }, minutes_ago: 3 },
  { event_type: 'client_error', payload: { component: 'video_player', warning: 'buffer_underflow' }, minutes_ago: 2 },
  { event_type: 'session_ended', payload: { total_time_sec: 2700 }, minutes_ago: 1 },
];

const initialMockEvents = rawMockEvents.map((e, idx) => ({
  id: `e-mock-${100 + idx}`,
  event_type: e.event_type,
  session_id: mockSessionId,
  learner_id: mockLearnerId,
  tenant_id: mockTenantId,
  device_id: e.device_id || 'd0000000-0000-0000-0000-000000000001',
  resource_id: e.resource_id || null,
  competency_id: e.competency_id || null,
  task_id: e.task_id || null,
  ai_interaction_id: null,
  mentor_id: e.mentor_id || null,
  payload: e.payload || {},
  sequence_num: idx + 1,
  timestamp: new Date(now - e.minutes_ago * minute).toISOString(),
  received_at: new Date(now - e.minutes_ago * minute).toISOString(),
}));

const fallbackEventsList: any[] = [...initialMockEvents];

// Fallback weekly reports store
const mockWeeklyReportData = {
  learner_id: mockLearnerId,
  learner_name: 'Ahmed Khan',
  week_label: '2026-W30',
  week_start: '2026-07-21',
  week_end: '2026-07-27',
  glance: {
    sessions_attended: 4,
    sessions_planned: 5,
    total_learning_time_min: 200,
    topics_covered: ['Basic Fractions', 'Equivalent Fractions'],
    tasks_completed: 14,
    tasks_total: 16,
    mentor_check_ins: 2,
  },
  summary_text: 'Ahmed continued building his understanding of fractions this week. He completed his review of basic fractions and made a great start on equivalent fractions. He needed a bit of extra support from his mentor on Wednesday, and that really helped him get unstuck.',
  topics: [
    { topic: 'Basic Fractions', mastery_level: 'developing', mastery_label: 'Making progress', mastery_percent: 78 },
    { topic: 'Equivalent Fractions', mastery_level: 'emerging', mastery_label: 'Just started', mastery_percent: 30 },
  ],
  confidence_summary: {
    average_score: 3.2,
    scale: 5,
    text: 'Ahmed reported feeling 3 out of 5 confident on equivalent fractions — which is exactly right for this stage.',
  },
  next_week_topics: ['Equivalent Fractions (continued)', 'Adding Fractions (same denominator)'],
  mentor_note: "Ahmed worked really hard this week and asked great questions! — Ms. Nadia",
  question_for_home: "Can you ask Ahmed: 'Can you show me two fractions that are the same amount?'",
  centre_name: 'LearnOS Pilot Learning Centre',
  generated_at: new Date().toISOString(),
};

const fallbackReportsList: any[] = [
  {
    id: 'r0000000-0000-0000-0000-000000000001',
    learner_id: mockLearnerId,
    parent_id: '30000000-0000-0000-0000-000000000001',
    tenant_id: mockTenantId,
    week_label: '2026-W30',
    week_start: '2026-07-21',
    week_end: '2026-07-27',
    status: 'ready',
    report_data: mockWeeklyReportData,
    mentor_reviewed: true,
    generated_at: new Date().toISOString(),
  },
];

let isDbConnected: boolean | null = null;

export const query = async <T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> => {
  try {
    const res = await pool.query<T>(text, params);
    isDbConnected = true;
    return res;
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.message?.includes('connect')) {
      if (isDbConnected === true) {
        console.warn('PostgreSQL connection lost. Operating in Pilot Fallback Mode.');
      }
      isDbConnected = false;
      return handleFallbackQuery<T>(text, params);
    }
    throw err;
  }
};

function handleFallbackQuery<T extends pg.QueryResultRow>(text: string, params: any[] = []): pg.QueryResult<T> {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT user by email
  if (normalized.includes('select') && normalized.includes('from users where lower(email)')) {
    const emailParam = String(params[0] || '').toLowerCase();
    const user = pilotUsersMap.get(emailParam);
    return { rows: user ? [user] : [], command: 'SELECT', rowCount: user ? 1 : 0, oid: 0, fields: [] } as any;
  }

  // 2. SELECT user by id
  if (normalized.includes('select') && normalized.includes('from users where id')) {
    const idParam = String(params[0] || '');
    const user = Array.from(pilotUsersMap.values()).find(u => u.id === idParam);
    return { rows: user ? [user] : [], command: 'SELECT', rowCount: user ? 1 : 0, oid: 0, fields: [] } as any;
  }

  // 3. INSERT user (Registration)
  if (normalized.includes('insert into users')) {
    const email = params[0];
    const passwordHash = params[1];
    const name = params[2];
    const role = params[3];
    const tenantId = params[4];
    const newId = `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newUser = {
      id: newId,
      email,
      password_hash: passwordHash,
      name,
      role,
      tenant_id: tenantId,
      is_active: true,
      created_at: new Date().toISOString()
    };
    pilotUsersMap.set(email.toLowerCase(), newUser);
    return { rows: [newUser], command: 'INSERT', rowCount: 1, oid: 0, fields: [] } as any;
  }

  // 4. Weekly Reports
  if (normalized.includes('from weekly_reports')) {
    let filtered = [...fallbackReportsList];
    const learnerId = params[0];
    if (learnerId) {
      filtered = filtered.filter((r) => r.learner_id === learnerId);
    }
    if (params[1] && typeof params[1] === 'string' && params[1].includes('W')) {
      filtered = filtered.filter((r) => r.week_label === params[1]);
    }

    return { rows: filtered, command: 'SELECT', rowCount: filtered.length, oid: 0, fields: [] } as any;
  }

  if (normalized.includes('insert into weekly_reports') || normalized.includes('update weekly_reports')) {
    let report = fallbackReportsList[0];
    if (normalized.includes('set status = \'sent\'')) {
      report.status = 'sent';
      report.email_sent_at = new Date().toISOString();
    } else if (params.length >= 7) {
      report = {
        id: `r_${Date.now()}`,
        learner_id: params[0],
        parent_id: params[1],
        tenant_id: params[2],
        week_label: params[3],
        week_start: params[4],
        week_end: params[5],
        status: 'ready',
        report_data: typeof params[6] === 'string' ? JSON.parse(params[6]) : params[6],
        generated_at: new Date().toISOString(),
      };
      const idx = fallbackReportsList.findIndex((r) => r.learner_id === report.learner_id && r.week_label === report.week_label);
      if (idx >= 0) fallbackReportsList[idx] = report;
      else fallbackReportsList.unshift(report);
    }
    return { rows: [report], command: 'MUTATION', rowCount: 1, oid: 0, fields: [] } as any;
  }

  // 5. Session existence check: SELECT * FROM sessions WHERE id = $1
  if (normalized.includes('from sessions where id')) {
    const sessionId = params[0];
    if (sessionId === mockSessionId || sessionId === 'b4000000-0000-0000-0000-000000000001' || sessionId === 'b4000000-0000-0000-0000-000000000002') {
      return {
        rows: [{
          id: sessionId,
          learner_id: sessionId.includes('0002') ? '10000000-0000-0000-0000-000000000002' : mockLearnerId,
          tenant_id: mockTenantId,
          status: 'active',
          started_at: new Date(Date.now() - 3600000).toISOString()
        }],
        command: 'SELECT', rowCount: 1, oid: 0, fields: []
      } as any;
    }
    return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
  }

  // 6. INSERT INTO session_events
  if (normalized.includes('insert into session_events')) {
    const eventType = params[0];
    const sessionId = params[1];
    const learnerId = params[2];
    const tenantId = params[3];
    const deviceId = params[4] || null;
    const resourceId = params[5] || null;
    const competencyId = params[6] || null;
    const taskId = params[7] || null;
    const aiInteractionId = params[8] || null;
    const mentorId = params[9] || null;
    const payload = params[10] || {};
    const clientTs = params[11] || new Date().toISOString();

    const existingInSession = fallbackEventsList.filter(e => e.session_id === sessionId);
    const sequenceNum = existingInSession.length + 1;
    const newId = `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nowIso = new Date().toISOString();

    const newEvt = {
      id: newId,
      event_type: eventType,
      session_id: sessionId,
      learner_id: learnerId,
      tenant_id: tenantId,
      device_id: deviceId,
      resource_id: resourceId,
      competency_id: competencyId,
      task_id: taskId,
      ai_interaction_id: aiInteractionId,
      mentor_id: mentorId,
      payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
      sequence_num: sequenceNum,
      timestamp: clientTs,
      received_at: nowIso,
    };

    fallbackEventsList.push(newEvt);
    return { rows: [newEvt], command: 'INSERT', rowCount: 1, oid: 0, fields: [] } as any;
  }

  // 7. SELECT FROM session_events
  if (normalized.includes('from session_events')) {
    let filtered = [...fallbackEventsList];

    if (normalized.includes('where id = $1')) {
      const targetId = params[0];
      filtered = filtered.filter(e => e.id === targetId);
      return { rows: filtered, command: 'SELECT', rowCount: filtered.length, oid: 0, fields: [] } as any;
    }

    if (normalized.includes('session_id =')) {
      const sessionIdParam = params[0];
      filtered = filtered.filter(e => e.session_id === sessionIdParam);
    }

    if (normalized.includes('learner_id =')) {
      const learnerIdParam = params.length > 1 ? params[1] : params[0];
      filtered = filtered.filter(e => e.learner_id === learnerIdParam);
    }

    if (normalized.includes('event_type =')) {
      const typeParam = params.find(p => typeof p === 'string' && !p.includes('-') && !p.includes(':'));
      if (typeParam) {
        filtered = filtered.filter(e => e.event_type === typeParam);
      }
    }

    filtered.sort((a, b) => {
      const tA = new Date(a.received_at || a.timestamp).getTime();
      const tB = new Date(b.received_at || b.timestamp).getTime();
      if (tA !== tB) return tA - tB;
      return (a.sequence_num || 0) - (b.sequence_num || 0);
    });

    const limitParam = params[params.length - 1];
    if (typeof limitParam === 'number') {
      filtered = filtered.slice(0, limitParam);
    }

    return { rows: filtered, command: 'SELECT', rowCount: filtered.length, oid: 0, fields: [] } as any;
  }

  // 8. Resource Providers
  if (normalized.includes('from resource_providers')) {
    return {
      rows: [
        { id: 'b0000000-0000-0000-0000-000000000001', name: 'Khan Academy', type: 'deep_link', base_url: 'https://www.khanacademy.org', attribution_text: 'Content by Khan Academy (CC BY-NC-SA 3.0)', is_active: true },
        { id: 'b0000000-0000-0000-0000-000000000002', name: 'LearnOS Internal', type: 'internal', base_url: null, attribution_text: 'LearnOS Learning Content', is_active: true }
      ],
      command: 'SELECT', rowCount: 2, oid: 0, fields: []
    } as any;
  }

  // 9. Resources / Resource Search
  if (normalized.includes('from resources')) {
    const seedResources = [
      {
        id: 'b1000000-0000-0000-0000-000000000001',
        provider_id: 'b0000000-0000-0000-0000-000000000001',
        title: 'Equivalent Fractions – Khan Academy Video',
        format: 'video',
        url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic/arith-review-equivalent-fractions/v/equivalent-fractions',
        duration_min: 8, grade_min: 5, grade_max: 7, language: 'en', is_age_safe: true, is_active: true, fit_type: 'primary', provider_name: 'Khan Academy'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000002',
        provider_id: 'b0000000-0000-0000-0000-000000000002',
        title: 'Equivalent Fractions – Practice Quiz (5 Questions)',
        format: 'internal_quiz',
        url: null, duration_min: 10, grade_min: 5, grade_max: 7, language: 'en', is_age_safe: true, is_active: true, fit_type: 'primary', provider_name: 'LearnOS Internal'
      },
      {
        id: 'b1000000-0000-0000-0000-000000000003',
        provider_id: 'b0000000-0000-0000-0000-000000000002',
        title: 'Basic Fractions – Quick Review Article',
        format: 'article',
        url: null, duration_min: 5, grade_min: 4, grade_max: 6, language: 'en', is_age_safe: true, is_active: true, fit_type: 'primary', provider_name: 'LearnOS Internal'
      }
    ];

    if (normalized.includes('count(')) {
      return { rows: [{ count: seedResources.length }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
    }
    return { rows: seedResources, command: 'SELECT', rowCount: seedResources.length, oid: 0, fields: [] } as any;
  }

  // 10. Digital Twin / Competency / Profile / Goals / Default fallback
  if (normalized.includes('from learner_competency_states')) {
    return {
      rows: [
        {
          id: 'lcs-001', competency_id: 'c0000000-0000-0000-0000-000000000001', subject: 'Mathematics', topic: 'Basic Fractions',
          mastery_level: 'proficient', mastery_score: 0.78, attempts_total: 12, attempts_correct: 9, learner_confidence: 4,
          last_practiced_at: new Date().toISOString(), review_due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          evidence_summary: '9 of 12 check questions correct across 3 sessions.'
        }
      ],
      command: 'SELECT', rowCount: 1, oid: 0, fields: []
    } as any;
  }

  if (normalized.includes('from learner_profiles_twin')) {
    return {
      rows: [{ preferred_format: 'video', preferred_session_length_min: 40, hint_response: 'benefits_from_hints', pace_signal: 'average' }],
      command: 'SELECT', rowCount: 1, oid: 0, fields: []
    } as any;
  }

  if (normalized.includes('from learner_goals')) {
    return {
      rows: [{ id: 'g1', goal_type: 'academic', description: 'Master Grade 6 Fraction Arithmetic', status: 'active', created_at: new Date().toISOString() }],
      command: 'SELECT', rowCount: 1, oid: 0, fields: []
    } as any;
  }

  // Generic mutations (INSERT, UPDATE, DELETE) -> return mock object
  if (normalized.includes('insert into') || normalized.includes('update') || normalized.includes('delete')) {
    return {
      rows: [{ id: `mock_${Date.now()}`, created_at: new Date().toISOString() }],
      command: 'MUTATION', rowCount: 1, oid: 0, fields: []
    } as any;
  }

  return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
}

export default {
  query,
  pool,
};

export enum EventType {
  // Session lifecycle
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SESSION_ABANDONED = 'session_abandoned',
  SESSION_PAUSED = 'session_paused',
  SESSION_RESUMED = 'session_resumed',

  // Task lifecycle
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_SKIPPED = 'task_skipped',

  // Resource engagement
  RESOURCE_OPENED = 'resource_opened',
  RESOURCE_CLOSED = 'resource_closed',
  RESOURCE_COMPLETED = 'resource_completed',
  VIDEO_PAUSED = 'video_paused',
  VIDEO_REPLAYED = 'video_replayed',
  VIDEO_RESUMED = 'video_resumed',
  VIDEO_SEEKED = 'video_seeked',
  RESOURCE_RETRY = 'resource_retry',

  // AI Companion interaction
  AI_QUESTION_ASKED = 'ai_question_asked',
  AI_RESPONSE_RECEIVED = 'ai_response_received',
  AI_ESCALATION_SUGGESTED = 'ai_escalation_suggested',
  HINT_REQUESTED = 'hint_requested',
  LEARN_YOUR_WAY_REQUESTED = 'learn_your_way_requested',

  // Check/assessment
  CHECK_STARTED = 'check_started',
  CHECK_QUESTION_ANSWERED = 'check_question_answered',
  CHECK_QUESTION_CORRECT = 'check_question_correct',
  CHECK_QUESTION_INCORRECT = 'check_question_incorrect',
  CHECK_COMPLETED = 'check_completed',

  // Mentor
  MENTOR_ESCALATION_REQUESTED = 'mentor_escalation_requested',
  MENTOR_ARRIVED = 'mentor_arrived',
  MENTOR_NOTE_ADDED = 'mentor_note_added',
  MENTOR_ESCALATION_RESOLVED = 'mentor_escalation_resolved',
  LEARNER_STUCK_FLAGGED = 'learner_stuck_flagged',

  // Reflection
  REFLECTION_STARTED = 'reflection_started',
  REFLECTION_SUBMITTED = 'reflection_submitted',
  CONFIDENCE_REPORTED = 'confidence_reported',

  // System
  DEVICE_HEARTBEAT = 'device_heartbeat',
  CLIENT_ERROR = 'client_error',
}

export interface TelemetryEventInput {
  event_type: EventType | string;
  session_id: string;
  learner_id?: string;
  tenant_id?: string;
  device_id?: string;
  resource_id?: string;
  competency_id?: string;
  task_id?: string;
  ai_interaction_id?: string;
  mentor_id?: string;
  payload?: Record<string, any>;
  timestamp?: string;
}

export interface LearnOSEvent {
  id: string;
  event_type: EventType | string;
  session_id: string;
  learner_id: string;
  tenant_id: string;
  device_id?: string | null;
  resource_id?: string | null;
  competency_id?: string | null;
  task_id?: string | null;
  ai_interaction_id?: string | null;
  mentor_id?: string | null;
  payload: Record<string, any>;
  timestamp: string;
  received_at: string;
  sequence_num: number;
}

export interface SessionSummary {
  session_id: string;
  learner_id: string;
  total_duration_min: number;
  tasks_completed: number;
  resources_used: number;
  check_questions_attempted: number;
  check_questions_correct: number;
  ai_questions_asked: number;
  mentor_escalations: number;
  confidence_reported: number | null;
  competencies_practiced: string[];
  evidence_quality: 'formative_checks_present' | 'exposure_only';
  total_events: number;
}

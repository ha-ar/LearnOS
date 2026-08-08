export type ResourceFormat = 
  | 'video'
  | 'article'
  | 'internal_quiz'
  | 'interactive'
  | 'worked_example'
  | 'audio'
  | 'other';

export type ProviderType = 'deep_link' | 'internal' | 'embedded' | 'api';

export type FitType = 'primary' | 'supplementary' | 'fallback' | 'enrichment';

export type OutcomeLabel = 'helped' | 'neutral' | 'did_not_help' | 'too_hard' | 'too_easy';

export interface ResourceProvider {
  id: string;
  name: string;
  type: ProviderType;
  base_url?: string | null;
  attribution_text?: string | null;
  terms_url?: string | null;
  age_min: number;
  age_max: number;
  integration_notes?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Resource {
  id: string;
  provider_id: string;
  external_id?: string | null;
  title: string;
  description?: string | null;
  format: ResourceFormat;
  url?: string | null;
  embed_url?: string | null;
  duration_min?: number | null;
  grade_min?: number | null;
  grade_max?: number | null;
  language: string;
  is_age_safe: boolean;
  thumbnail_url?: string | null;
  attribution?: string | null;
  is_active: boolean;
  created_at?: string;
  // Included when fetched with relations
  provider?: ResourceProvider;
  fit_type?: FitType;
  competency_ids?: string[];
}

export interface ResourceCompetencyMap {
  resource_id: string;
  competency_id: string;
  fit_type: FitType;
}

export interface QuizQuestionOption {
  key: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  resource_id: string;
  competency_id?: string | null;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: QuizQuestionOption[] | null;
  correct_answer?: string; // Hidden when sending question to student if omitted
  explanation?: string | null; // Shown after submission
  difficulty: 'easy' | 'medium' | 'hard';
  grade_level?: number | null;
  display_order: number;
  created_at?: string;
}

export interface ResourceOutcome {
  id: string;
  resource_id: string;
  learner_id: string;
  session_id?: string | null;
  competency_id?: string | null;
  used_at?: string;
  time_spent_sec?: number;
  check_questions_attempted?: number;
  check_questions_correct?: number;
  learner_confidence_after?: number | null;
  outcome_label?: OutcomeLabel | null;
}

export interface ResourceSelectRequest {
  learner_id: string;
  competency_id: string;
  session_id?: string;
  task_id?: string;
  exclude_resource_ids?: string[];
  preferred_format_override?: ResourceFormat;
}

export interface ResourceRecommendationItem {
  resource_id: string;
  title: string;
  format: ResourceFormat;
  url?: string | null;
  embed_url?: string | null;
  duration_min?: number | null;
  attribution?: string | null;
  fit_type?: FitType;
  provider_name?: string;
  score?: number;
  selection_reason?: string;
}

export interface ResourceSelectResponse {
  primary: ResourceRecommendationItem | null;
  fallbacks: ResourceRecommendationItem[];
  escalation_threshold_reached: boolean;
  recommendation_action?: 'continue' | 'switch_resource' | 'mentor_escalation';
  rule_fired: string;
  log_id?: string;
}

export interface QuizSubmissionItem {
  question_id: string;
  selected_answer: string;
}

export interface QuizSubmissionRequest {
  learner_id: string;
  session_id?: string;
  competency_id?: string;
  time_spent_sec?: number;
  learner_confidence_after?: number;
  answers: QuizSubmissionItem[];
}

export interface QuizQuestionResult {
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface QuizSubmissionResponse {
  outcome_id: string;
  score_percentage: number;
  questions_attempted: number;
  questions_correct: number;
  results: QuizQuestionResult[];
  outcome_label: OutcomeLabel;
}

export interface SearchResourcesOptions {
  competency_id?: string;
  grade?: number;
  format?: ResourceFormat;
  subject?: string;
  provider_id?: string;
  is_age_safe?: boolean;
  limit?: number;
  offset?: number;
}

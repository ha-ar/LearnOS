export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  grade: string;
}

export interface AuthResult {
  access_token: string;
  refresh_token?: string;
  user: { id: string; name: string; email: string; role: string };
}

export interface PlacementOption {
  key: string;
  text: string;
}

export interface PlacementQuestion {
  id: string;
  competency_id: string;
  topic: string;
  grade_level: number | null;
  difficulty: string;
  question_text: string;
  question_type: string;
  options: PlacementOption[];
}

export interface PlacementTest {
  subject: string;
  total_questions: number;
  questions: PlacementQuestion[];
}

export interface Preferences {
  preferred_format?: string;
  preferred_session_length_min?: number;
}

export interface PlacementResultItem {
  competency_id: string;
  topic: string;
  total: number;
  correct: number;
  mastery_level: string;
  mastery_score: number;
}

export interface PlanItem {
  competency_id: string;
  sequence_order: number;
  target_mastery_level?: string;
  item_status?: string;
  status?: string;
  topic: string;
  grade_level: string | null;
  mastery_level: string;
  mastery_score: number | null;
}

export interface LearningPlan {
  has_plan: boolean;
  plan: { id: string; term_label: string; subject: string; status: string; created_at: string } | null;
  items: PlanItem[];
}

export interface RecommendedResource {
  id: string;
  title: string;
  format: string;
  url: string | null;
  duration_min: number | null;
  fit_type: string;
}

export interface Recommendation {
  has_plan: boolean;
  complete?: boolean;
  plan_progress?: { completed: number; total: number };
  next_competency?: {
    competency_id: string;
    topic: string;
    grade_level: string | null;
    current_mastery: string;
    sequence_order: number;
  };
  recommended_resource?: RecommendedResource | null;
  reason?: string;
  message?: string;
}

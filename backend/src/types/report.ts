export interface WeeklyReportGlance {
  sessions_attended: number;
  sessions_planned: number;
  total_learning_time_min: number;
  topics_covered: string[];
  tasks_completed: number;
  tasks_total: number;
  mentor_check_ins: number;
}

export interface WeeklyReportTopic {
  topic: string;
  mastery_level: string; // 'not_started' | 'emerging' | 'developing' | 'proficient' | 'mastered'
  mastery_label: string; // Plain-language label, e.g., 'Making progress'
  mastery_percent: number;
}

export interface WeeklyReportConfidence {
  average_score: number;
  scale: number;
  text: string;
}

export interface WeeklyReportData {
  learner_id: string;
  learner_name: string;
  week_label: string;
  week_start: string;
  week_end: string;
  glance: WeeklyReportGlance;
  summary_text: string;
  topics: WeeklyReportTopic[];
  confidence_summary: WeeklyReportConfidence;
  next_week_topics: string[];
  mentor_note: string | null;
  question_for_home: string;
  centre_name?: string;
  generated_at?: string;
}

export interface WeeklyReportRow {
  id: string;
  learner_id: string;
  parent_id: string;
  tenant_id: string;
  week_label: string;
  week_start: string;
  week_end: string;
  status: 'draft' | 'ready' | 'sent';
  report_data: WeeklyReportData;
  mentor_reviewed: boolean;
  mentor_reviewed_at?: string | null;
  mentor_reviewer_id?: string | null;
  email_sent_at?: string | null;
  email_opened_at?: string | null;
  viewed_at?: string | null;
  generated_at: string;
}

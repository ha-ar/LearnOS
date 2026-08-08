export interface User {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'mentor' | 'parent' | 'admin' | 'superadmin';
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  grade?: string;
  consent_given?: boolean;
  guardian_id?: string;
  guardian_name?: string;
  mentor_name?: string;
}

export interface Device {
  id: string;
  name: string;
  room?: string;
  tenant_id: string;
  device_token: string;
  platform: string;
  os_version?: string;
  app_version?: string;
  is_active: boolean;
  registered_at: string;
  last_seen_at?: string;
}

export interface Curriculum {
  id: string;
  code: string;
  name: string;
  country: string;
  region?: string;
  description?: string;
  version?: string;
}

export interface TenantConfig {
  id?: string;
  tenant_id: string;
  active_curriculum_id: string | null;
  active_curriculum_name?: string;
  active_subjects: string[];
  grade_min: number;
  grade_max: number;
  settings?: Record<string, any>;
  updated_at?: string;
}

export interface DashboardStats {
  active_learners: number;
  total_learners: number;
  sessions_this_week: number;
  sessions_completed: number;
  open_escalations: number;
  resolved_escalations: number;
  avg_mastery_pct: number;
  devices_online: number;
  devices_total: number;
}

export interface AtRiskLearner {
  learner_id: string;
  name: string;
  email: string;
  grade: string;
  sessions_completed: number;
  sessions_total: number;
  open_escalations: number;
  avg_mastery_pct: number;
  risk_reason: string;
}

export interface ConsentRecord {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  grade?: string;
  guardian_id?: string;
  guardian_name?: string;
  guardian_email?: string;
  consent_given: boolean;
  consent_given_at?: string;
}

export interface DataRequest {
  id: string;
  learner_id: string;
  requested_by?: string;
  request_type: 'export' | 'deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
  requested_at: string;
  completed_at?: string;
  file_url?: string;
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  result: 'success' | 'failure' | 'blocked';
  payload_summary?: string;
  created_at: string;
}

import { query } from '../db/index.js';

export type EscalationTriggerType = 'learner_requested' | 'ai_suggested' | 'system_rule';

export interface CreateEscalationParams {
  session_id: string;
  learner_id: string;
  tenant_id: string;
  trigger_type: EscalationTriggerType;
  brief_text: string;
  ai_suggested_approach?: string;
  evidence_snapshot?: Record<string, any>;
  competency_id?: string;
}

export class EscalationService {
  /**
   * Create an escalation record and assign it to the learner's mentor.
   * Shared by every trigger path (AI safety, recommendation engine, kiosk exit, learner-requested).
   */
  static async create(params: CreateEscalationParams) {
    const mentorRes = await query(
      `SELECT mentor_id FROM learner_mentor_assignments
       WHERE learner_id = $1 AND is_active = true
       ORDER BY assigned_at DESC LIMIT 1`,
      [params.learner_id]
    );
    const mentorId = mentorRes.rows[0]?.mentor_id ?? null;

    const res = await query(
      `INSERT INTO escalations
         (session_id, learner_id, tenant_id, competency_id, assigned_mentor_id,
          trigger_type, brief_text, ai_suggested_approach, evidence_snapshot, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [
        params.session_id,
        params.learner_id,
        params.tenant_id,
        params.competency_id ?? null,
        mentorId,
        params.trigger_type,
        params.brief_text,
        params.ai_suggested_approach ?? null,
        JSON.stringify(params.evidence_snapshot ?? {}),
      ]
    );

    return res.rows[0];
  }
}

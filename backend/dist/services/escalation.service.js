"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationService = void 0;
const index_js_1 = require("../db/index.js");
class EscalationService {
    /**
     * Create an escalation record and assign it to the learner's mentor.
     * Shared by every trigger path (AI safety, recommendation engine, kiosk exit, learner-requested).
     */
    static async create(params) {
        const mentorRes = await (0, index_js_1.query)(`SELECT assigned_mentor_id FROM learner_mentor_assignments
       WHERE learner_id = $1
       ORDER BY assigned_at DESC LIMIT 1`, [params.learner_id]);
        const mentorId = mentorRes.rows[0]?.assigned_mentor_id ?? null;
        const res = await (0, index_js_1.query)(`INSERT INTO escalations
         (session_id, learner_id, tenant_id, competency_id, assigned_mentor_id,
          trigger_type, brief_text, ai_suggested_approach, evidence_snapshot, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`, [
            params.session_id,
            params.learner_id,
            params.tenant_id,
            params.competency_id ?? null,
            mentorId,
            params.trigger_type,
            params.brief_text,
            params.ai_suggested_approach ?? null,
            JSON.stringify(params.evidence_snapshot ?? {}),
        ]);
        return res.rows[0];
    }
}
exports.EscalationService = EscalationService;

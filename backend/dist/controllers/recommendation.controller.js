"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationController = void 0;
const recommendation_service_js_1 = require("../services/recommendation.service.js");
class RecommendationController {
    /**
     * POST /api/recommendations/next-action
     */
    static async getNextAction(req, res) {
        try {
            const { session_id, current_task_id, incorrect_count_this_task, hints_requested, ai_turns } = req.body;
            const learnerId = req.user.sub;
            const tenantId = req.user.tenant_id;
            if (!session_id) {
                res.status(400).json({ error: 'session_id is required', code: 'MISSING_FIELDS' });
                return;
            }
            const recommendation = await recommendation_service_js_1.RecommendationService.getNextBestAction({
                learner_id: learnerId,
                tenant_id: tenantId,
                session_id,
                current_task_id,
                incorrect_count_this_task,
                hints_requested,
                ai_turns,
            });
            res.status(200).json(recommendation);
        }
        catch (err) {
            console.error('Get next action error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/evidence/run
     */
    static async runEvidenceEngine(req, res) {
        try {
            const { session_id } = req.body;
            const learnerId = req.user.sub;
            if (!session_id) {
                res.status(400).json({ error: 'session_id is required', code: 'MISSING_FIELDS' });
                return;
            }
            const result = await recommendation_service_js_1.RecommendationService.runEvidenceEngine(session_id, learnerId);
            res.status(200).json(result);
        }
        catch (err) {
            console.error('Run evidence engine error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.RecommendationController = RecommendationController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyController = void 0;
const safety_service_js_1 = require("../services/safety.service.js");
class SafetyController {
    /**
     * POST /api/safety/check
     */
    static async checkContent(req, res) {
        try {
            const { text } = req.body;
            if (!text) {
                res.status(400).json({ error: 'text is required', code: 'MISSING_FIELDS' });
                return;
            }
            const result = safety_service_js_1.SafetyService.checkContentSafety(text);
            res.status(200).json(result);
        }
        catch (err) {
            console.error('Check safety error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/consent/:learner_id
     */
    static async verifyConsent(req, res) {
        try {
            const { learner_id } = req.params;
            const hasConsent = await safety_service_js_1.SafetyService.verifyConsentGate(learner_id);
            res.status(200).json({ learner_id, consent_given: hasConsent });
        }
        catch (err) {
            console.error('Verify consent error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.SafetyController = SafetyController;

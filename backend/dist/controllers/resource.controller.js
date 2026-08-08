"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceController = void 0;
const resource_service_js_1 = require("../services/resource.service.js");
class ResourceController {
    /**
     * GET /api/resources
     */
    static async searchResources(req, res) {
        try {
            const { competency_id, grade, format, limit } = req.query;
            const resources = await resource_service_js_1.ResourceService.searchResources({
                competency_id: competency_id,
                grade: grade ? parseInt(grade, 10) : undefined,
                format: format,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            res.status(200).json({ resources });
        }
        catch (err) {
            console.error('Search resources error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/resources/:id
     */
    static async getResourceById(req, res) {
        try {
            const { id } = req.params;
            const resource = await resource_service_js_1.ResourceService.getResourceById(id);
            res.status(200).json({ resource });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Get resource by id error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * POST /api/resources/select
     */
    static async selectBestResource(req, res) {
        try {
            const { competency_id, preferred_format, exclude_resource_ids } = req.body;
            const learnerId = req.user.sub;
            if (!competency_id) {
                res.status(400).json({ error: 'competency_id is required', code: 'MISSING_FIELDS' });
                return;
            }
            const selection = await resource_service_js_1.ResourceService.selectBestResource({
                learner_id: learnerId,
                competency_id,
                preferred_format,
                exclude_resource_ids,
            });
            res.status(200).json(selection);
        }
        catch (err) {
            console.error('Select best resource error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/resources/:id/quiz
     */
    static async getQuizQuestions(req, res) {
        try {
            const { id } = req.params;
            const questions = await resource_service_js_1.ResourceService.getQuizQuestions(id, false);
            res.status(200).json({ questions });
        }
        catch (err) {
            console.error('Get quiz questions error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/resources/:id/quiz/submit
     */
    static async submitQuiz(req, res) {
        try {
            const { id } = req.params;
            const { answers } = req.body;
            const learnerId = req.user.sub;
            if (!answers || !Array.isArray(answers)) {
                res.status(400).json({ error: 'answers array is required', code: 'MISSING_FIELDS' });
                return;
            }
            const result = await resource_service_js_1.ResourceService.scoreQuiz({
                resource_id: id,
                learner_id: learnerId,
                answers,
            });
            res.status(200).json(result);
        }
        catch (err) {
            console.error('Submit quiz error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/providers
     */
    static async listProviders(req, res) {
        try {
            const providers = await resource_service_js_1.ResourceService.listProviders();
            res.status(200).json({ providers });
        }
        catch (err) {
            console.error('List providers error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.ResourceController = ResourceController;

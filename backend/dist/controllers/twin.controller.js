"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwinController = void 0;
const twin_service_js_1 = require("../services/twin.service.js");
class TwinController {
    /**
     * Check if current user has access to learner's twin data
     */
    static checkAccess(req, learnerId) {
        const currentUser = req.user;
        if (currentUser.role === 'learner' && currentUser.sub !== learnerId) {
            return false;
        }
        return true;
    }
    /**
     * GET /api/twin/:learner_id
     */
    static async getTwinSummary(req, res) {
        try {
            const { learner_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const twin = await twin_service_js_1.TwinService.getTwinSummary(learner_id);
            res.status(200).json({ twin });
        }
        catch (err) {
            console.error('Get twin error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/competencies
     */
    static async getCompetencies(req, res) {
        try {
            const { learner_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const competencies = await twin_service_js_1.TwinService.getCompetencies(learner_id);
            res.status(200).json({ competencies });
        }
        catch (err) {
            console.error('Get competencies error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/competencies/:competency_id
     */
    static async getCompetencyById(req, res) {
        try {
            const { learner_id, competency_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const state = await twin_service_js_1.TwinService.getCompetencyById(learner_id, competency_id);
            res.status(200).json({ competency_state: state });
        }
        catch (err) {
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                console.error('Get competency by id error:', err);
                res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
            }
        }
    }
    /**
     * PATCH /api/twin/:learner_id/competencies/:competency_id
     */
    static async updateCompetency(req, res) {
        try {
            const { learner_id, competency_id } = req.params;
            const { mastery_level, mastery_score, attempts_total, attempts_correct, learner_confidence, evidence_summary } = req.body;
            const updated = await twin_service_js_1.TwinService.updateCompetencyMastery({
                learner_id,
                competency_id,
                mastery_level,
                mastery_score,
                attempts_total,
                attempts_correct,
                learner_confidence,
                evidence_summary,
            });
            res.status(200).json({ competency_state: updated });
        }
        catch (err) {
            console.error('Update competency error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/session-events
     */
    static async getSessionEvents(req, res) {
        try {
            const { learner_id } = req.params;
            const { session_id, limit, offset } = req.query;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const events = await twin_service_js_1.TwinService.getSessionEvents(learner_id, {
                session_id: session_id ? String(session_id) : undefined,
                limit: limit ? parseInt(String(limit), 10) : undefined,
                offset: offset ? parseInt(String(offset), 10) : undefined,
            });
            res.status(200).json({ events });
        }
        catch (err) {
            console.error('Get session events error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/twin/:learner_id/events
     */
    static async emitSessionEvent(req, res) {
        try {
            const { learner_id } = req.params;
            const { session_id, event_type, competency_id, resource_id, payload } = req.body;
            const currentUser = req.user;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            if (!session_id || !event_type) {
                res.status(400).json({ error: 'session_id and event_type are required', code: 'MISSING_FIELDS' });
                return;
            }
            const event = await twin_service_js_1.TwinService.emitSessionEvent({
                learner_id,
                session_id,
                event_type,
                competency_id,
                resource_id,
                payload,
                tenant_id: currentUser?.tenant_id,
            });
            res.status(201).json({ event });
        }
        catch (err) {
            console.error('Emit session event error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/goals
     */
    static async getGoals(req, res) {
        try {
            const { learner_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const goals = await twin_service_js_1.TwinService.getGoals(learner_id);
            res.status(200).json({ goals });
        }
        catch (err) {
            console.error('Get goals error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/twin/:learner_id/goals
     */
    static async createGoal(req, res) {
        try {
            const { learner_id } = req.params;
            const { goal_type, description, target_date } = req.body;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            if (!description) {
                res.status(400).json({ error: 'description is required', code: 'MISSING_FIELDS' });
                return;
            }
            const goal = await twin_service_js_1.TwinService.createGoal({
                learner_id,
                goal_type,
                description,
                target_date,
            });
            res.status(201).json({ goal });
        }
        catch (err) {
            console.error('Create goal error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/portfolio
     */
    static async getPortfolio(req, res) {
        try {
            const { learner_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const portfolio = await twin_service_js_1.TwinService.getPortfolio(learner_id);
            res.status(200).json({ portfolio });
        }
        catch (err) {
            console.error('Get portfolio error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/twin/:learner_id/portfolio
     */
    static async createPortfolioItem(req, res) {
        try {
            const { learner_id } = req.params;
            const { item_type, title, description, file_url, competency_ids } = req.body;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            if (!title) {
                res.status(400).json({ error: 'title is required', code: 'MISSING_FIELDS' });
                return;
            }
            const portfolioItem = await twin_service_js_1.TwinService.createPortfolioItem({
                learner_id,
                item_type,
                title,
                description,
                file_url,
                competency_ids,
            });
            res.status(201).json({ portfolio_item: portfolioItem });
        }
        catch (err) {
            console.error('Create portfolio item error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * GET /api/twin/:learner_id/mentor-notes
     */
    static async getMentorNotes(req, res) {
        try {
            const { learner_id } = req.params;
            if (!TwinController.checkAccess(req, learner_id)) {
                res.status(403).json({ error: 'Access denied to this Digital Twin', code: 'FORBIDDEN' });
                return;
            }
            const notes = await twin_service_js_1.TwinService.getMentorNotes(learner_id);
            res.status(200).json({ mentor_notes: notes });
        }
        catch (err) {
            console.error('Get mentor notes error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * POST /api/twin/:learner_id/mentor-notes
     */
    static async createMentorNote(req, res) {
        try {
            const { learner_id } = req.params;
            const { note_text, note_type, competency_id, is_parent_visible, session_id } = req.body;
            const currentUser = req.user;
            if (!note_text) {
                res.status(400).json({ error: 'note_text is required', code: 'MISSING_FIELDS' });
                return;
            }
            const note = await twin_service_js_1.TwinService.createMentorNote({
                learner_id,
                mentor_id: currentUser.sub,
                tenant_id: currentUser.tenant_id,
                session_id,
                competency_id,
                note_type,
                note_text,
                is_parent_visible,
            });
            res.status(201).json({ mentor_note: note });
        }
        catch (err) {
            console.error('Create mentor note error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
    /**
     * PATCH /api/twin/:learner_id/profile
     */
    static async updateTwinProfile(req, res) {
        try {
            const { learner_id } = req.params;
            const { preferred_format, preferred_session_length_min, hint_response, pace_signal, notes } = req.body;
            const profile = await twin_service_js_1.TwinService.updateTwinProfile(learner_id, {
                preferred_format,
                preferred_session_length_min,
                hint_response,
                pace_signal,
                notes,
            });
            res.status(200).json({ learning_profile: profile });
        }
        catch (err) {
            console.error('Update twin profile error:', err);
            res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
        }
    }
}
exports.TwinController = TwinController;

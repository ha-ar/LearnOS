"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorController = void 0;
const mentor_service_js_1 = require("../services/mentor.service.js");
exports.MentorController = {
    // GET /api/mentor/dashboard
    getDashboard: async (req, res) => {
        try {
            const mentorId = req.user.sub;
            const tenantId = req.user.tenant_id;
            const data = await mentor_service_js_1.MentorService.getLiveDashboard(mentorId, tenantId);
            res.json(data);
        }
        catch (err) {
            console.error('Mentor dashboard error:', err);
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                res.status(500).json({ error: 'Failed to load dashboard' });
            }
        }
    },
    // GET /api/mentor/escalations
    getEscalations: async (req, res) => {
        try {
            const tenantId = req.user.tenant_id;
            const data = await mentor_service_js_1.MentorService.getActiveEscalations(tenantId);
            res.json(data);
        }
        catch (err) {
            console.error('Mentor escalations error:', err);
            res.status(500).json({ error: 'Failed to load escalations' });
        }
    },
    // POST /api/mentor/escalations/:id/attend
    attendEscalation: async (req, res) => {
        try {
            const { id } = req.params;
            const mentorId = req.user.sub;
            const data = await mentor_service_js_1.MentorService.attendEscalation(id, mentorId);
            res.json(data);
        }
        catch (err) {
            console.error('Attend escalation error:', err);
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                res.status(500).json({ error: 'Failed to attend escalation' });
            }
        }
    },
    // POST /api/mentor/escalations/:id/resolve
    resolveEscalation: async (req, res) => {
        try {
            const { id } = req.params;
            const { outcome, mentor_note } = req.body;
            const mentorId = req.user.sub;
            const data = await mentor_service_js_1.MentorService.resolveEscalation(id, mentorId, mentor_note);
            res.json(data);
        }
        catch (err) {
            console.error('Resolve escalation error:', err);
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                res.status(500).json({ error: 'Failed to resolve escalation' });
            }
        }
    },
    // POST /api/mentor/escalations/:id/dismiss
    dismissEscalation: async (req, res) => {
        try {
            const { id } = req.params;
            const mentorId = req.user.sub;
            const data = await mentor_service_js_1.MentorService.dismissEscalation(id, mentorId);
            res.json(data);
        }
        catch (err) {
            console.error('Dismiss escalation error:', err);
            res.status(500).json({ error: 'Failed to dismiss escalation' });
        }
    },
    // GET /api/mentor/learners
    getLearners: async (req, res) => {
        try {
            const mentorId = req.user.sub;
            const tenantId = req.user.tenant_id;
            const data = await mentor_service_js_1.MentorService.getLiveDashboard(mentorId, tenantId);
            res.json({ learners: data.learners });
        }
        catch (err) {
            console.error('Get learners error:', err);
            res.status(500).json({ error: 'Failed to load learners' });
        }
    },
    // GET /api/mentor/learners/:id
    getLearnerDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const tenantId = req.user.tenant_id;
            const data = await mentor_service_js_1.MentorService.getLearnerDetail(id, tenantId);
            res.json(data);
        }
        catch (err) {
            console.error('Get learner detail error:', err);
            if (err.status) {
                res.status(err.status).json({ error: err.error, code: err.code });
            }
            else {
                res.status(500).json({ error: 'Failed to load learner' });
            }
        }
    },
    // GET /api/mentor/learners/:id/session/today
    getTodaySession: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await mentor_service_js_1.MentorService.getTodaySession(id);
            res.json(data);
        }
        catch (err) {
            console.error('Get today session error:', err);
            res.status(500).json({ error: 'Failed to load session' });
        }
    },
    // GET /api/mentor/learners/:id/notes
    getNotes: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await mentor_service_js_1.MentorService.getNotes(id);
            res.json(data);
        }
        catch (err) {
            console.error('Get notes error:', err);
            res.status(500).json({ error: 'Failed to load notes' });
        }
    },
    // POST /api/mentor/learners/:id/notes
    addNote: async (req, res) => {
        try {
            const { id } = req.params;
            const { note_type, competency_id, text, is_parent_visible } = req.body;
            if (!text?.trim()) {
                res.status(400).json({ error: 'Note text is required', code: 'MISSING_FIELDS' });
                return;
            }
            const mentorId = req.user.sub;
            const data = await mentor_service_js_1.MentorService.addNote({
                learnerId: id,
                mentorId,
                noteType: note_type || 'observation',
                noteText: text,
                competencyId: competency_id,
                isParentVisible: is_parent_visible ?? false,
            });
            res.status(201).json(data);
        }
        catch (err) {
            console.error('Add note error:', err);
            res.status(500).json({ error: 'Failed to add note' });
        }
    },
    // GET /api/mentor/summary
    getSummary: async (req, res) => {
        try {
            const mentorId = req.user.sub;
            const tenantId = req.user.tenant_id;
            const data = await mentor_service_js_1.MentorService.getSummary(mentorId, tenantId);
            res.json(data);
        }
        catch (err) {
            console.error('Get summary error:', err);
            res.status(500).json({ error: 'Failed to load summary' });
        }
    },
};

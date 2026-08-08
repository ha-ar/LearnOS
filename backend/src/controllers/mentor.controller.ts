import { Response } from 'express';
import { MentorService } from '../services/mentor.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export const MentorController = {

  // GET /api/mentor/dashboard
  getDashboard: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mentorId  = req.user!.sub;
      const tenantId  = req.user!.tenant_id;
      const data = await MentorService.getLiveDashboard(mentorId, tenantId);
      res.json(data);
    } catch (err: any) {
      console.error('Mentor dashboard error:', err);
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        res.status(500).json({ error: 'Failed to load dashboard' });
      }
    }
  },

  // GET /api/mentor/escalations
  getEscalations: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenant_id;
      const data = await MentorService.getActiveEscalations(tenantId);
      res.json(data);
    } catch (err: any) {
      console.error('Mentor escalations error:', err);
      res.status(500).json({ error: 'Failed to load escalations' });
    }
  },

  // POST /api/mentor/escalations/:id/attend
  attendEscalation: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const mentorId = req.user!.sub;
      const data = await MentorService.attendEscalation(id, mentorId);
      res.json(data);
    } catch (err: any) {
      console.error('Attend escalation error:', err);
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        res.status(500).json({ error: 'Failed to attend escalation' });
      }
    }
  },

  // POST /api/mentor/escalations/:id/resolve
  resolveEscalation: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { outcome, mentor_note } = req.body;
      const mentorId = req.user!.sub;
      const data = await MentorService.resolveEscalation(id, mentorId, mentor_note);
      res.json(data);
    } catch (err: any) {
      console.error('Resolve escalation error:', err);
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        res.status(500).json({ error: 'Failed to resolve escalation' });
      }
    }
  },

  // POST /api/mentor/escalations/:id/dismiss
  dismissEscalation: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const mentorId = req.user!.sub;
      const data = await MentorService.dismissEscalation(id, mentorId);
      res.json(data);
    } catch (err: any) {
      console.error('Dismiss escalation error:', err);
      res.status(500).json({ error: 'Failed to dismiss escalation' });
    }
  },

  // GET /api/mentor/learners
  getLearners: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mentorId = req.user!.sub;
      const tenantId = req.user!.tenant_id;
      const data = await MentorService.getLiveDashboard(mentorId, tenantId);
      res.json({ learners: data.learners });
    } catch (err: any) {
      console.error('Get learners error:', err);
      res.status(500).json({ error: 'Failed to load learners' });
    }
  },

  // GET /api/mentor/learners/:id
  getLearnerDetail: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenant_id;
      const data = await MentorService.getLearnerDetail(id, tenantId);
      res.json(data);
    } catch (err: any) {
      console.error('Get learner detail error:', err);
      if (err.status) {
        res.status(err.status).json({ error: err.error, code: err.code });
      } else {
        res.status(500).json({ error: 'Failed to load learner' });
      }
    }
  },

  // GET /api/mentor/learners/:id/session/today
  getTodaySession: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await MentorService.getTodaySession(id);
      res.json(data);
    } catch (err: any) {
      console.error('Get today session error:', err);
      res.status(500).json({ error: 'Failed to load session' });
    }
  },

  // GET /api/mentor/learners/:id/notes
  getNotes: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = await MentorService.getNotes(id);
      res.json(data);
    } catch (err: any) {
      console.error('Get notes error:', err);
      res.status(500).json({ error: 'Failed to load notes' });
    }
  },

  // POST /api/mentor/learners/:id/notes
  addNote: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { note_type, competency_id, text, is_parent_visible } = req.body;
      if (!text?.trim()) {
        res.status(400).json({ error: 'Note text is required', code: 'MISSING_FIELDS' });
        return;
      }
      const mentorId = req.user!.sub;
      const data = await MentorService.addNote({
        learnerId: id,
        mentorId,
        noteType: note_type || 'observation',
        noteText: text,
        competencyId: competency_id,
        isParentVisible: is_parent_visible ?? false,
      });
      res.status(201).json(data);
    } catch (err: any) {
      console.error('Add note error:', err);
      res.status(500).json({ error: 'Failed to add note' });
    }
  },

  // GET /api/mentor/summary
  getSummary: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const mentorId = req.user!.sub;
      const tenantId = req.user!.tenant_id;
      const data = await MentorService.getSummary(mentorId, tenantId);
      res.json(data);
    } catch (err: any) {
      console.error('Get summary error:', err);
      res.status(500).json({ error: 'Failed to load summary' });
    }
  },
};

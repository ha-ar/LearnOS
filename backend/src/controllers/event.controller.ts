import { Response } from 'express';
import { EventService } from '../services/event.service.js';
import { AuthenticatedRequest } from '../types/auth.js';

export class EventController {
  /**
   * POST /api/events (and /events)
   * Single event ingestion
   */
  static async ingestEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        event_type,
        session_id,
        device_id,
        resource_id,
        competency_id,
        task_id,
        ai_interaction_id,
        mentor_id,
        payload,
        timestamp,
      } = req.body;
      const currentUser = req.user!;

      if (!event_type || !session_id) {
        res.status(400).json({ error: 'event_type and session_id are required', code: 'MISSING_FIELDS' });
        return;
      }

      const event = await EventService.ingestEvent(
        {
          event_type,
          session_id,
          device_id,
          resource_id,
          competency_id,
          task_id,
          ai_interaction_id,
          mentor_id,
          payload,
          timestamp,
        },
        currentUser
      );

      res.status(201).json({
        data: {
          event_id: event.id,
          sequence_num: event.sequence_num,
        },
        event,
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({ error: err.message, code: err.code || 'BAD_REQUEST' });
        return;
      }
      console.error('Ingest event error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/events/batch (and /events/batch)
   * Batch event ingestion (up to 50 events)
   */
  static async ingestBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { events } = req.body;
      const currentUser = req.user!;

      if (!events || !Array.isArray(events)) {
        res.status(400).json({ error: 'events array is required', code: 'MISSING_FIELDS' });
        return;
      }

      if (events.length === 0 || events.length > 50) {
        res.status(400).json({ error: 'Batch size must be between 1 and 50 events', code: 'INVALID_BATCH_SIZE' });
        return;
      }

      const inserted = await EventService.ingestBatchEvents(events, currentUser);
      res.status(201).json({
        data: {
          inserted_count: inserted.length,
          events: inserted,
        },
        count: inserted.length,
        events: inserted,
      });
    } catch (err: any) {
      if (err.statusCode) {
        res.status(err.statusCode).json({ error: err.message, code: err.code || 'BAD_REQUEST' });
        return;
      }
      console.error('Ingest batch error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/events (and /events)
   * Query session events
   */
  static async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { session_id, learner_id, event_type, since, limit } = req.query;
      const currentUser = req.user!;

      // If learner, enforce learner_id = currentUser.sub unless session_id is owned by them
      const effectiveLearnerId = currentUser.role === 'learner' ? currentUser.sub : (learner_id as string);

      if (session_id && currentUser.role === 'learner') {
        const check = await EventService.verifySessionOwnership(session_id as string, currentUser.sub, currentUser.role);
        if (!check.valid) {
          res.status(check.code === 'FORBIDDEN' ? 403 : 400).json({ error: check.error, code: check.code });
          return;
        }
      }

      const events = await EventService.getSessionEvents({
        session_id: session_id as string,
        learner_id: effectiveLearnerId,
        event_type: event_type as string,
        since: since as string,
        limit: limit ? parseInt(limit as string, 10) : 100,
      });

      res.status(200).json({ data: events, events });
    } catch (err: any) {
      console.error('Get events error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/events/:event_id (and /events/:event_id)
   * Single event lookup
   */
  static async getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { event_id } = req.params;
      const event = await EventService.getEventById(event_id);

      if (!event) {
        res.status(404).json({ error: 'Event not found', code: 'NOT_FOUND' });
        return;
      }

      const currentUser = req.user!;
      if (currentUser.role === 'learner' && event.learner_id !== currentUser.sub) {
        res.status(403).json({ error: 'Unauthorized to view this event', code: 'FORBIDDEN' });
        return;
      }

      res.status(200).json({ data: event, event });
    } catch (err: any) {
      console.error('Get event by ID error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/events/summary (and /events/summary)
   * Session summary query
   */
  static async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { session_id } = req.query;
      const currentUser = req.user!;

      if (!session_id) {
        res.status(400).json({ error: 'session_id query parameter is required', code: 'MISSING_FIELDS' });
        return;
      }

      if (currentUser.role === 'learner') {
        const check = await EventService.verifySessionOwnership(session_id as string, currentUser.sub, currentUser.role);
        if (!check.valid) {
          res.status(check.code === 'FORBIDDEN' ? 403 : 400).json({ error: check.error, code: check.code });
          return;
        }
      }

      const summary = await EventService.getSessionSummary(session_id as string);
      res.status(200).json({ data: summary, summary });
    } catch (err: any) {
      console.error('Get session summary error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}

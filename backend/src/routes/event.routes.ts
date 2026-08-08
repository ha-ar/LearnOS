import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/', EventController.ingestEvent);
router.post('/batch', EventController.ingestBatch);
router.get('/', EventController.getEvents);
router.get('/summary', EventController.getSummary);
router.get('/:event_id', EventController.getEventById);

export default router;

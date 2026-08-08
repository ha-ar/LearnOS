import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All resource routes require valid authentication
router.use(authenticateToken);

router.get('/', ResourceController.searchResources);
router.post('/select', ResourceController.selectBestResource);
router.get('/providers', ResourceController.listProviders);
router.get('/:id', ResourceController.getResourceById);
router.get('/:id/quiz', ResourceController.getQuizQuestions);
router.post('/:id/quiz/submit', ResourceController.submitQuiz);

export default router;

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import twinRoutes from './routes/twin.routes.js';
import eventRoutes from './routes/event.routes.js';
import safetyRoutes from './routes/safety.routes.js';
import sessionRoutes from './routes/session.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import reportRoutes from './routes/report.routes.js';
import aiRoutes from './routes/ai.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';

export const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'learnos-backend', timestamp: new Date().toISOString() });
});

// API Routes (Mounted under /api/ and / for compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/twin', twinRoutes);
app.use('/api/events', eventRoutes);
app.use('/events', eventRoutes); // Direct root endpoint alias per TASK-07 spec
app.use('/api/safety', safetyRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
});

export default app;

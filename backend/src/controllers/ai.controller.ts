import { Response } from 'express';
import { AiService } from '../services/ai.service.js';
import { EscalationService } from '../services/escalation.service.js';
import { AuthenticatedRequest } from '../types/auth.js';
import { query } from '../db/index.js';

export class AiController {
  /**
   * POST /api/ai/tutor
   */
  static async tutorInteraction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { prompt, topic, history, session_id } = req.body;
      const learner_name = req.user?.name || 'Learner';

      if (!prompt) {
        res.status(400).json({ error: 'prompt is required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = await AiService.generateTutoringResponse({
        prompt,
        learner_name,
        topic,
        history,
      });

      if (result.escalate_to_mentor) {
        if (session_id) {
          try {
            await EscalationService.create({
              session_id,
              learner_id: req.user!.sub,
              tenant_id: req.user!.tenant_id,
              trigger_type: 'ai_suggested',
              brief_text: `⚠️ AI COMPANION SAFETY FLAG — ${learner_name} sent a message during a ${topic || 'learning'} session that the AI Companion flagged as a possible sign of distress. Please check in with them directly.`,
              ai_suggested_approach: 'Start with a calm, private check-in. Ask open-ended questions and follow the centre\'s student wellbeing protocol before returning to academic content.',
              evidence_snapshot: { prompt_snippet: String(prompt).slice(0, 200), model_used: result.model_used },
            });
          } catch (escErr) {
            console.error('Failed to create AI-suggested escalation:', escErr);
          }
        } else {
          console.warn('AI tutor flagged escalate_to_mentor but no session_id was provided — escalation not persisted.');
        }
      }

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('AI Tutor error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/ai/hint
   */
  static async getHint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { question_text, hint_level } = req.body;

      if (!question_text) {
        res.status(400).json({ error: 'question_text is required', code: 'MISSING_FIELDS' });
        return;
      }

      const hint = await AiService.generateSmartHint(question_text, hint_level || 1);
      res.status(200).json({ success: true, hint, hint_level: hint_level || 1 });
    } catch (err: any) {
      console.error('AI Hint error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/ai/explain — Google Learn Your Way On-the-Go Adaptive Explanation Engine
   */
  static async explainConcept(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { concept, topic, mastery_level, explanation_style, pacing_speed } = req.body;
      const learner_name = req.user?.name || 'Learner';

      if (!concept) {
        res.status(400).json({ error: 'concept is required', code: 'MISSING_FIELDS' });
        return;
      }

      const result = await AiService.generateLearnYourWayExplanation({
        concept,
        topic,
        learner_name,
        mastery_level,
        explanation_style,
        pacing_speed,
      });

      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('AI Explain Concept error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/ai/lesson
   * Generate a full structured lesson for a competency.
   * Accepts: { competency_id?, topic?, subject?, grade_level?, mastery_level? }
   * Returns:  LessonContent (title, intro, sections[], key_points[], summary, quick_check)
   */
  static async generateLesson(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { competency_id, topic: topicInput, subject, grade_level, mastery_level } = req.body;
      const learner_name = req.user?.name || 'Learner';

      let topic = topicInput;
      let competency_description = '';
      let resolvedGradeLevel = grade_level || 'Grade 6';

      // If competency_id provided, resolve topic + description from DB
      if (competency_id) {
        const compRes = await query(
          `SELECT topic, description, grade_level FROM competencies WHERE id = $1`,
          [competency_id]
        );
        if (compRes.rows.length > 0) {
          const comp = compRes.rows[0];
          topic = topic || comp.topic;
          competency_description = comp.description || '';
          resolvedGradeLevel = grade_level || comp.grade_level || 'Grade 6';
        }
      }

      if (!topic) {
        res.status(400).json({ error: 'topic or competency_id is required', code: 'MISSING_FIELDS' });
        return;
      }

      const lesson = await AiService.generateLessonContent({
        topic,
        competency_description,
        grade_level: resolvedGradeLevel,
        learner_name,
        mastery_level: mastery_level || 'emerging',
        subject: subject || 'Mathematics',
      });

      res.status(200).json({ success: true, lesson });
    } catch (err: any) {
      console.error('AI Generate Lesson error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/ai/quick-check — Check written or spoken answer casually as a friendly study buddy
   */
  static async checkQuickAnswer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { question, answer, topic, grade_level } = req.body;
      const learner_name = req.user?.name || 'Learner';

      if (!question || !answer) {
        res.status(400).json({ error: 'question and answer are required', code: 'MISSING_FIELDS' });
        return;
      }

      const evaluation = await AiService.evaluateQuickCheckAnswer({
        question,
        answer,
        topic,
        learner_name,
        grade_level,
      });

      res.status(200).json({ success: true, ...evaluation });
    } catch (err: any) {
      console.error('AI Quick Check error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  }
}



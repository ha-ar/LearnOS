"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const index_js_1 = require("../db/index.js");
class RecommendationService {
    /**
     * Evidence Engine: Process session events into competency mastery updates
     */
    static async runEvidenceEngine(sessionId, learnerId) {
        // 1. Fetch check question events for this session
        const eventsRes = await (0, index_js_1.query)(`SELECT competency_id, payload, event_type
       FROM session_events
       WHERE session_id = $1 AND competency_id IS NOT NULL
         AND event_type IN ('check_question_answered', 'check_question_correct', 'check_question_incorrect')`, [sessionId]);
        const events = eventsRes.rows;
        if (events.length === 0) {
            return { competencies_updated: 0, message: 'No diagnostic check question events to process' };
        }
        // Group events by competency_id
        const grouped = new Map();
        for (const e of events) {
            const compId = e.competency_id;
            if (!grouped.has(compId)) {
                grouped.set(compId, { total: 0, correct: 0 });
            }
            const item = grouped.get(compId);
            item.total++;
            if (e.event_type === 'check_question_correct' || e.payload?.is_correct === true) {
                item.correct++;
            }
        }
        let updatedCount = 0;
        for (const [compId, stats] of grouped.entries()) {
            const score = Math.round((stats.correct / (stats.total || 1)) * 100) / 100;
            // Mastery Level Threshold Mapping:
            // score >= 0.85 AND total >= 5 => mastered
            // score >= 0.70 AND total >= 3 => proficient
            // score >= 0.50 AND total >= 2 => developing
            // total >= 1 => emerging
            let level = 'emerging';
            if (score >= 0.85 && stats.total >= 5)
                level = 'mastered';
            else if (score >= 0.70 && stats.total >= 3)
                level = 'proficient';
            else if (score >= 0.50 && stats.total >= 2)
                level = 'developing';
            const summary = `${stats.correct} of ${stats.total} check questions correct in session ${sessionId.substring(0, 8)}. Primary formative evidence.`;
            // Update Digital Twin state
            await (0, index_js_1.query)(`INSERT INTO learner_competency_states (
           learner_id, competency_id, mastery_level, mastery_score, attempts_total,
           attempts_correct, last_practiced_at, review_due_at, evidence_summary, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '7 days', $7, NOW())
         ON CONFLICT (learner_id, competency_id) DO UPDATE
         SET mastery_level = EXCLUDED.mastery_level,
             mastery_score = EXCLUDED.mastery_score,
             attempts_total = learner_competency_states.attempts_total + EXCLUDED.attempts_total,
             attempts_correct = learner_competency_states.attempts_correct + EXCLUDED.attempts_correct,
             last_practiced_at = NOW(),
             review_due_at = NOW() + INTERVAL '7 days',
             evidence_summary = EXCLUDED.evidence_summary,
             updated_at = NOW()`, [learnerId, compId, level, score, stats.total, stats.correct, summary]);
            updatedCount++;
        }
        // Log evidence run
        await (0, index_js_1.query)(`INSERT INTO evidence_runs (session_id, learner_id, run_type, events_processed, competencies_updated)
       VALUES ($1, $2, 'full', $3, $4)`, [sessionId, learnerId, events.length, updatedCount]);
        return { competencies_updated: updatedCount, events_processed: events.length };
    }
    /**
     * Recommendation Engine: Rule-Based Next Action Decision Engine
     */
    static async getNextBestAction(input) {
        const incorrect = input.incorrect_count_this_task || 0;
        const hints = input.hints_requested || 0;
        const aiTurns = input.ai_turns || 0;
        let actionType = 'continue';
        let ruleFired = 'default_continue_rule';
        let confidence = 'medium';
        let message = 'Keep going! You are making steady progress.';
        let evidence = [];
        // Rule 1: Mentor Escalation Threshold Rule
        // IF incorrect >= 3 AND (hints >= 2 OR ai_turns >= 2)
        if (incorrect >= 3 && (hints >= 2 || aiTurns >= 2)) {
            actionType = 'mentor_escalation';
            ruleFired = 'escalation_threshold_rule';
            confidence = 'high';
            message = "You've made a great attempt! Your mentor Ms. Nadia has been notified and is coming to assist.";
            evidence = [
                { type: 'incorrect_answers_count', value: incorrect },
                { type: 'hints_requested_count', value: hints },
                { type: 'ai_turns_count', value: aiTurns },
            ];
        }
        // Rule 2: Resource Switch Rule (Stuck on current modality)
        else if (incorrect >= 2 && hints >= 1) {
            actionType = 'switch_resource';
            ruleFired = 'resource_switch_rule';
            confidence = 'medium';
            message = 'Let us try a different learning format, such as a step-by-step worked example.';
            evidence = [{ type: 'incorrect_answers_count', value: incorrect }];
        }
        // Rule 3: Advance to Next Task Rule
        else if (incorrect === 0 && hints === 0 && input.current_task_id) {
            actionType = 'advance_to_next_task';
            ruleFired = 'advance_task_rule';
            confidence = 'high';
            message = 'Excellent work! You answered correctly. Ready for the next practice check!';
        }
        // Log decision to recommendation_log for auditability
        await (0, index_js_1.query)(`INSERT INTO recommendation_log (session_id, learner_id, action_type, rule_fired, confidence, evidence)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            input.session_id,
            input.learner_id,
            actionType,
            ruleFired,
            confidence,
            JSON.stringify(evidence),
        ]);
        return {
            action_type: actionType,
            rule_fired: ruleFired,
            confidence,
            message_for_learner: message,
            evidence,
        };
    }
}
exports.RecommendationService = RecommendationService;

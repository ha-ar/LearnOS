"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const node_test_1 = require("node:test");
(0, node_test_1.describe)('TASK-06: Resource Intelligence Layer Unit & Ranking Tests', () => {
    (0, node_test_1.test)('Rule-based Selection Ranking Logic: ranks candidate resources by score', () => {
        const candidates = [
            {
                id: 'r1',
                provider_id: 'p1',
                title: 'Basic Fractions Article',
                format: 'article',
                language: 'en',
                is_age_safe: true,
                is_active: true,
                fit_type: 'supplementary',
                duration_min: 5,
            },
            {
                id: 'r2',
                provider_id: 'p1',
                title: 'Equivalent Fractions Video',
                format: 'video',
                language: 'en',
                is_age_safe: true,
                is_active: true,
                fit_type: 'primary',
                duration_min: 8,
            },
        ];
        const preferredFormat = 'video';
        const scored = candidates.map((resource) => {
            let score = 0;
            if (resource.fit_type === 'primary')
                score += 30;
            if (preferredFormat && resource.format === preferredFormat)
                score += 25;
            if (resource.duration_min && resource.duration_min <= 10)
                score += 10;
            return { resource, score };
        });
        scored.sort((a, b) => b.score - a.score);
        node_assert_1.default.strictEqual(scored[0].resource.id, 'r2');
        node_assert_1.default.strictEqual(scored[0].score, 65); // 30 (primary) + 25 (video match) + 10 (duration <= 10)
        node_assert_1.default.strictEqual(scored[1].resource.id, 'r1');
        node_assert_1.default.strictEqual(scored[1].score, 10); // 10 (duration <= 10)
    });
    (0, node_test_1.test)('Quiz Scoring: correctly calculates percentage score and pass status', () => {
        const mockQuestions = [
            { id: 'q1', correct_answer: 'b' },
            { id: 'q2', correct_answer: 'a' },
            { id: 'q3', correct_answer: 'c' },
        ];
        const userAnswers = [
            { question_id: 'q1', selected_answer: 'b' }, // correct
            { question_id: 'q2', selected_answer: 'a' }, // correct
            { question_id: 'q3', selected_answer: 'd' }, // wrong
        ];
        let correctCount = 0;
        mockQuestions.forEach((q) => {
            const userAns = userAnswers.find((a) => a.question_id === q.id);
            if (userAns && userAns.selected_answer === q.correct_answer) {
                correctCount++;
            }
        });
        const scorePct = Math.round((correctCount / mockQuestions.length) * 100);
        node_assert_1.default.strictEqual(correctCount, 2);
        node_assert_1.default.strictEqual(scorePct, 67);
        node_assert_1.default.strictEqual(scorePct >= 70, false);
    });
});

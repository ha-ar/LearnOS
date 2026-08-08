import { GoogleGenAI } from '@google/genai';
import { SafetyService } from './safety.service.js';

export interface LessonSection {
  heading: string;
  body: string;
}

export interface LessonContent {
  title: string;
  intro: string;
  sections: LessonSection[];
  key_points: string[];
  summary: string;
  quick_check: string;
  competency: string;
  grade_level: string;
}

export interface GenerateLessonParams {
  topic: string;
  competency_description?: string;
  grade_level?: string;
  learner_name?: string;
  mastery_level?: string;
  subject?: string;
}

export interface TutoringRequestParams {
  prompt: string;
  learner_name?: string;
  grade_level?: string;
  topic?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface TutoringResponse {
  reply: string;
  socratic_hint_level: number;
  safety_passed: boolean;
  escalate_to_mentor: boolean;
  model_used: string;
}

export interface LearnYourWayRequestParams {
  concept: string;
  topic?: string;
  learner_name?: string;
  grade_level?: string;
  mastery_level?: string;
  explanation_style?: 'eli5' | 'step_by_step' | 'real_world' | 'deep_dive';
  pacing_speed?: string;
}

export class AiService {
  private static getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Google Learn Your Way — Dynamic Adaptive Content Explanation Engine
   */
  static async generateLearnYourWayExplanation(params: LearnYourWayRequestParams): Promise<{
    concept: string;
    style: string;
    explanation: string;
    key_takeaways: string[];
    quick_check_question: string;
    adapted_for: string;
  }> {
    const {
      concept,
      topic = 'Fractions & Ratios',
      learner_name = 'Learner',
      grade_level = 'Grade 6',
      mastery_level = 'Intermediate',
      explanation_style = 'real_world',
      pacing_speed = 'Balanced Pace',
    } = params;

    const styleInstructions: Record<string, string> = {
      eli5: 'Explain this like I am 5 years old. Use super simple metaphors (toys, snacks, playgrounds), short sentences, and fun warm language.',
      step_by_step: 'Provide a structured, step-by-step visual logic breakdown. Use numbered steps (1, 2, 3), clear headers, and intuitive progression.',
      real_world: 'Explain using a practical real-world scenario (sports, gaming, cooking, or pocket money). Connect the mathematical theory directly to real life.',
      deep_dive: 'Provide an analytical, rigorous explanation. Show the mathematical principles, properties, algebraic connections, and why the rule works behind the scenes.',
    };

    const targetStylePrompt = styleInstructions[explanation_style] || styleInstructions.real_world;
    const ai = this.getAiClient();
    const adaptedForText = `${learner_name} • ${grade_level} (${mastery_level}) • ${explanation_style.toUpperCase()} • ${pacing_speed}`;

    if (!ai) {
      // Deterministic Adaptive Fallback
      return {
        concept,
        style: explanation_style,
        explanation: `Here is how ${concept} works in ${topic}:\n\n` +
          `Imagine slicing a pizza into 4 equal slices. Each slice is 1/4 of the whole pizza. If you take 2 slices, you have 2/4, which is the exact same amount as 1/2 of the whole pizza! That is what ${concept} is all about — expressing the exact same quantity in different forms.`,
        key_takeaways: [
          `${concept} represents equal parts of a whole set or shape.`,
          'Multiplying or dividing top and bottom by the same number keeps the value identical.',
          'Always look for common factors when simplifying.'
        ],
        quick_check_question: `If you have 3 out of 6 slices of a pie, what is the simplest fraction that represents your pie?`,
        adapted_for: adaptedForText,
      };
    }

    try {
      const prompt = `Topic: ${topic}
Concept to Explain: "${concept}"
Learner: ${learner_name} (${grade_level}, Current Mastery Level: ${mastery_level})
Explanation Style Requested: ${explanation_style.toUpperCase()}

Instructions:
${targetStylePrompt}

Respond strictly in JSON with these keys:
{
  "explanation": "Markdown text formatted explanation matching the requested style",
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "quick_check_question": "One quick single-line understanding check question for the student"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          maxOutputTokens: 600,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        concept,
        style: explanation_style,
        explanation: parsed.explanation || `Understanding ${concept}: Break it into equal parts and compare!`,
        key_takeaways: parsed.key_takeaways || [`Key understanding for ${concept}`],
        quick_check_question: parsed.quick_check_question || 'What is the most important step in this problem?',
        adapted_for: adaptedForText,
      };
    } catch (err: any) {
      console.warn('Gemini Learn Your Way API call error:', err?.message || err);
      return {
        concept,
        style: explanation_style,
        explanation: `Let's break down **${concept}** together!\n\nWhen we look at ${topic}, ${concept} helps us compare values fairly.`,
        key_takeaways: [`${concept} helps structure mathematical relationships.`],
        quick_check_question: `Why is understanding ${concept} useful in math?`,
        adapted_for: adaptedForText,
      };
    }
  }

  /**
   * Socratic AI Learning Tutor Response Generator
   */
  static async generateTutoringResponse(params: TutoringRequestParams): Promise<TutoringResponse> {
    const { prompt, learner_name = 'Learner', grade_level = 'Grade 6', topic = 'Fractions', history = [] } = params;

    // 1. Run safety check on input text first
    const safetyCheck = SafetyService.checkContentSafety(prompt);
    if (!safetyCheck.safe) {
      if (safetyCheck.should_escalate_to_mentor) {
        return {
          reply: `I hear you, ${learner_name}. Learning can feel overwhelming sometimes, but you are doing great by showing up! I'm letting Ms. Nadia know so she can check in with you in a moment. Let's take a deep breath together.`,
          socratic_hint_level: 0,
          safety_passed: false,
          escalate_to_mentor: true,
          model_used: 'safety-rule-guard',
        };
      }
      return {
        reply: `I want to make sure we stay focused on our ${topic} lesson! How about we try breaking down the current problem together?`,
        socratic_hint_level: 0,
        safety_passed: false,
        escalate_to_mentor: false,
        model_used: 'safety-rule-guard',
      };
    }

    const ai = this.getAiClient();

    // Fallback if no Gemini API Key is configured
    if (!ai) {
      const fallbackReply = this.getFallbackTutoringReply(prompt, topic, learner_name);
      return {
        reply: fallbackReply,
        socratic_hint_level: 1,
        safety_passed: true,
        escalate_to_mentor: false,
        model_used: 'deterministic-fallback',
      };
    }

    try {
      const systemInstruction = `You are Lumos, a warm, patient, and encouraging AI learning companion for ${learner_name} (${grade_level} Math, topic: ${topic}).
Your Core Rules:
1. ALWAYS use the Socratic method: Never give the direct answer to a problem.
2. Ask one gentle clarifying question or give a real-world analogy (e.g. cutting a pizza or chocolate bar).
3. Keep responses concise (maximum 3 sentences).
4. Be super encouraging and celebrate effort over correctness!
5. Never issue formal grades or marks.`;

      const contents = [
        ...history.map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: prompt }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      });

      const replyText = response.text || this.getFallbackTutoringReply(prompt, topic, learner_name);

      // Post-generation safety check
      const postSafety = SafetyService.checkContentSafety(replyText);
      const finalReply = postSafety.safe ? replyText : 'Let us think about this problem step by step! What part of the question should we look at first?';

      return {
        reply: finalReply,
        socratic_hint_level: 1,
        safety_passed: postSafety.safe,
        escalate_to_mentor: false,
        model_used: 'gemini-2.5-flash',
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, using rule-based fallback:', err?.message || err);
      return {
        reply: this.getFallbackTutoringReply(prompt, topic, learner_name),
        socratic_hint_level: 1,
        safety_passed: true,
        escalate_to_mentor: false,
        model_used: 'deterministic-fallback-on-error',
      };
    }
  }

  /**
   * Progressive Hint Generator for Quiz Questions
   */
  static async generateSmartHint(questionText: string, hintLevel: number = 1): Promise<string> {
    const ai = this.getAiClient();
    if (!ai) {
      if (hintLevel === 1) return 'Think about what the numerator (top number) and denominator (bottom number) represent!';
      if (hintLevel === 2) return 'Try multiplying both top and bottom by the exact same number to find an equivalent fraction.';
      return 'Remember: 1/2 is the same as 2/4 or 3/6 because they cover the exact same amount of the whole!';
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Question: "${questionText}"
Generate a Hint Level ${hintLevel} (1 = subtle clue, 2 = structural clue, 3 = step-by-step breakdown). Do NOT give the final answer. Keep it under 2 sentences.`,
        config: { temperature: 0.5, maxOutputTokens: 150 },
      });

      return response.text || 'Look closely at the numbers and try breaking them down into equal parts!';
    } catch {
      return 'Look closely at the numbers and try breaking them down into equal parts!';
    }
  }

  /**
   * AI Parent Summary Generator for Weekly Reports
   */
  static async generateParentWeeklySummary(params: {
    learner_name: string;
    topics: string[];
    sessions_completed: number;
    mentor_notes?: string;
  }): Promise<string> {
    const ai = this.getAiClient();
    const { learner_name, topics, sessions_completed, mentor_notes } = params;
    const firstName = learner_name.split(' ')[0];

    if (!ai) {
      return `${firstName} made wonderful progress this week across ${topics.join(' and ')}. They completed ${sessions_completed} learning sessions with great focus and persistence.`;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Learner: ${learner_name}
Topics Covered: ${topics.join(', ')}
Sessions Completed: ${sessions_completed}
Mentor Note: "${mentor_notes || 'Great effort this week!'}"

Write a warm, 3-sentence encouraging summary for the parent's weekly report. Highlight their effort and key accomplishment in plain, positive language.`,
        config: { temperature: 0.7, maxOutputTokens: 200 },
      });

      return response.text || `${firstName} had a productive week mastering ${topics.join(', ')} across ${sessions_completed} sessions!`;
    } catch {
      return `${firstName} had a productive week mastering ${topics.join(', ')} across ${sessions_completed} sessions!`;
    }
  }

  /**
   * Deterministic Fallback Tutor Reply
   */
  private static getFallbackTutoringReply(prompt: string, topic: string, learnerName: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('equivalent') || lower.includes('equal')) {
      return `Imagine a pizza sliced into 2 big pieces, and another sliced into 4 smaller pieces. If you eat 1 big slice (1/2), how many small slices (out of 4) would you need to eat the same amount?`;
    }
    if (lower.includes('help') || lower.includes('stuck') || lower.includes('don\'t know')) {
      return `That is completely okay, ${learnerName}! Great learners get stuck all the time. What is the very first number or word in the question that feels confusing?`;
    }
    return `You are doing awesome on ${topic}! What do you think happens if we break this problem into two smaller steps?`;
  }

  /**
   * AI Lesson Generator — generates a full structured lesson for a competency.
   * Used by the Flutter learning canvas to deliver on-the-go content.
   * Falls back to deterministic structured content when API key is not configured.
   */
  static async generateLessonContent(params: GenerateLessonParams): Promise<LessonContent> {
    const {
      topic,
      competency_description = '',
      grade_level = 'Grade 6',
      learner_name = 'Learner',
      mastery_level = 'emerging',
      subject = 'Mathematics',
    } = params;

    const ai = this.getAiClient();

    // Deterministic fallback for when Gemini is unavailable
    if (!ai) {
      return this.getFallbackLesson(topic, grade_level, subject);
    }

    try {
      const prompt = `You are a curriculum expert generating a structured lesson for LearnOS, an AI-powered learning centre for students aged 10-16.

Lesson Request:
- Topic: ${topic}
- Competency: ${competency_description || topic}
- Grade Level: ${grade_level}
- Subject: ${subject}
- Learner's Current Mastery: ${mastery_level}
- Curriculum: Pakistan National Curriculum (Mathematics focus)
- Student Name: ${learner_name}

Instructions:
1. Write a complete, self-contained lesson that a student can learn from without a teacher.
2. Use clear, age-appropriate language suitable for ${grade_level}.
3. Include real-world examples (money, food, everyday objects) — no abstract examples.
4. Include 3 content sections with clear headings.
5. Make it engaging and encouraging.
6. Each section body should be 3–5 sentences with concrete examples.

Respond ONLY with valid JSON in this exact schema:
{
  "title": "Lesson title (engaging, short)",
  "intro": "1-2 sentence friendly introduction of the topic",
  "sections": [
    { "heading": "Section 1 heading", "body": "Section 1 content with examples" },
    { "heading": "Section 2 heading", "body": "Section 2 content with examples" },
    { "heading": "Section 3 heading", "body": "Section 3 content with examples" }
  ],
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "summary": "1 sentence summary of what was learned",
  "quick_check": "One multiple-choice or short-answer question to verify understanding"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          maxOutputTokens: 1200,
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Validate structure
      if (!parsed.title || !parsed.sections || !Array.isArray(parsed.sections)) {
        return this.getFallbackLesson(topic, grade_level, subject);
      }

      return {
        title: parsed.title,
        intro: parsed.intro || `Let's explore ${topic} together!`,
        sections: parsed.sections.slice(0, 3),
        key_points: parsed.key_points || [`Understanding ${topic} is key to ${subject}!`],
        summary: parsed.summary || `You have learned about ${topic}.`,
        quick_check: parsed.quick_check || `What is the most important thing you learned about ${topic}?`,
        competency: topic,
        grade_level,
      };
    } catch (err: any) {
      console.warn('Gemini lesson generation failed, using fallback:', err?.message || err);
      return this.getFallbackLesson(topic, grade_level, subject);
    }
  }

  /**
   * Deterministic fallback lesson generator (works without Gemini API key)
   */
  private static getFallbackLesson(topic: string, gradeLevel: string, subject: string): LessonContent {
    return {
      title: `Understanding ${topic}`,
      intro: `Welcome! In this lesson you will explore ${topic} — an important concept in ${subject} for ${gradeLevel}.`,
      sections: [
        {
          heading: 'What Is It?',
          body: `${topic} is a fundamental concept in ${subject}. Think of it like dividing something fair and equal among friends. When we talk about ${topic}, we are describing a relationship between numbers or quantities that follows clear rules.`,
        },
        {
          heading: 'How Does It Work?',
          body: `To understand ${topic}, start with something you know well — like sharing food or money. Imagine you have 12 chocolates to share equally with 3 friends. Each friend gets 4 chocolates. This is the same kind of reasoning we use in ${topic}: looking for equal groups and fair relationships between numbers.`,
        },
        {
          heading: 'Real-World Examples',
          body: `You use ${topic} every day without realising it! When you split a bill with friends, check if a sale is truly 50% off, or measure ingredients for a recipe — you are applying the logic of ${topic}. Understanding this deeply will help you solve problems faster in tests and in daily life.`,
        },
      ],
      key_points: [
        `${topic} is built on the idea of equal, fair relationships between numbers.`,
        'Always check your answer by working backwards — does it make sense?',
        `Practise with real objects (coins, fruit, paper folding) to build confidence.`,
      ],
      summary: `You have now learned the core ideas behind ${topic} and seen how they apply to real-life situations.`,
      quick_check: `Can you give one example from your daily life where ${topic} would be useful? Think about food, shopping, or sports.`,
      competency: topic,
      grade_level: gradeLevel,
    };
  }
}


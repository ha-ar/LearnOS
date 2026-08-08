import { query } from '../db/index.js';

export interface ContentSafetyResult {
  safe: boolean;
  risk_level: 'none' | 'low' | 'medium' | 'high';
  flags: string[];
  filtered_text: string | null;
  should_escalate_to_mentor: boolean;
  reason?: string;
}

const DISTRESS_KEYWORDS = [
  'hate myself', 'want to hurt', 'give up', 'hate everything',
  'i am stupid', 'im stupid', 'i hate my life', 'depressed',
];

const FORMAL_GRADING_TERMS = [
  'i grade you', 'your final grade is', 'you get an a+', 'you get a b+', 'official mark',
];

export class SafetyService {
  /**
   * Run content safety check on AI responses or learner input
   */
  static checkContentSafety(text: string): ContentSafetyResult {
    const flags: string[] = [];
    let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    let shouldEscalate = false;
    let safe = true;
    let reason = '';

    const lowerText = text.toLowerCase();

    // Rule 1: Distress signal detection (high severity)
    const hasDistressKeyword = DISTRESS_KEYWORDS.some((kw) => lowerText.includes(kw));
    if (hasDistressKeyword) {
      flags.push('mental_health_signal');
      riskLevel = 'high';
      shouldEscalate = true;
      safe = false;
      reason = 'Potential emotional distress signal detected';
    }

    // Rule 2: Unapproved external URLs
    const urlMatch = text.match(/https?:\/\/[^\s]+/gi);
    if (urlMatch) {
      const allowedDomains = ['khanacademy.org', 'learnos.org'];
      const hasUnapprovedUrl = urlMatch.some(
        (url) => !allowedDomains.some((domain) => url.includes(domain))
      );
      if (hasUnapprovedUrl) {
        flags.push('external_url');
        if (riskLevel !== 'high') riskLevel = 'medium';
        safe = false;
        reason = 'Contains unapproved external link';
      }
    }

    // Rule 3: Formal grading language block
    const hasFormalGrading = FORMAL_GRADING_TERMS.some((term) => lowerText.includes(term));
    if (hasFormalGrading) {
      flags.push('formal_assessment');
      if (riskLevel === 'none') riskLevel = 'low';
      safe = false;
      reason = 'AI is not permitted to issue formal grades';
    }

    return {
      safe,
      risk_level: riskLevel,
      flags,
      filtered_text: safe ? text : null,
      should_escalate_to_mentor: shouldEscalate,
      reason,
    };
  }

  /**
   * Verify learner consent gate before starting session
   */
  static async verifyConsentGate(learnerId: string): Promise<boolean> {
    const res = await query(
      `SELECT consent_given FROM learner_profiles WHERE learner_id = $1`,
      [learnerId]
    );

    if (res.rows.length === 0) return false;
    return res.rows[0].consent_given === true;
  }

  /**
   * Log safety flag to DB
   */
  static async raiseSafetyFlag(params: {
    session_id: string;
    learner_id: string;
    tenant_id: string;
    ai_interaction_id?: string;
    flag_type: string;
    severity: 'low' | 'medium' | 'high';
    content_snippet: string;
    action_taken: 'blocked' | 'modified' | 'logged_only' | 'mentor_notified';
  }) {
    const res = await query(
      `INSERT INTO safety_flags (
         session_id, learner_id, tenant_id, ai_interaction_id, flag_type,
         severity, content_snippet, action_taken, mentor_notified
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        params.session_id,
        params.learner_id,
        params.tenant_id,
        params.ai_interaction_id || null,
        params.flag_type,
        params.severity,
        params.content_snippet.substring(0, 200),
        params.action_taken,
        params.severity === 'high',
      ]
    );

    return res.rows[0];
  }
}

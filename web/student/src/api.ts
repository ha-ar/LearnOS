import {
  AuthResult,
  LearningPlan,
  PlacementTest,
  Preferences,
  Recommendation,
  RegisterInput,
} from './types';

const TOKEN_KEY = 'learnos_student_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const Api = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const res = await fetch('/api/onboarding/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handle<AuthResult>(res);
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handle<AuthResult>(res);
  },

  async getPlacementTest(subject = 'Mathematics'): Promise<PlacementTest> {
    const res = await fetch(`/api/onboarding/placement-test?subject=${encodeURIComponent(subject)}`, {
      headers: authHeaders(),
    });
    return handle<PlacementTest>(res);
  },

  async submitPlacement(body: {
    grade: string;
    subject?: string;
    answers: { question_id: string; selected: string }[];
    preferences?: Preferences;
  }) {
    const res = await fetch('/api/onboarding/placement', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handle<{ placement_result: any[]; plan: any; next_recommendation: Recommendation }>(res);
  },

  async getPlan(subject = 'Mathematics'): Promise<LearningPlan> {
    const res = await fetch(`/api/onboarding/plan?subject=${encodeURIComponent(subject)}`, {
      headers: authHeaders(),
    });
    return handle<LearningPlan>(res);
  },

  async getNext(subject = 'Mathematics'): Promise<{ recommendation: Recommendation }> {
    const res = await fetch(`/api/onboarding/next?subject=${encodeURIComponent(subject)}`, {
      headers: authHeaders(),
    });
    return handle<{ recommendation: Recommendation }>(res);
  },
};

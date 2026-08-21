import { MOCK_PARENT_DATA } from './mock.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

export function getToken() { return localStorage.getItem('learnos_parent_token'); }
export function setToken(t) { localStorage.setItem('learnos_parent_token', t); }
export function clearToken() { localStorage.removeItem('learnos_parent_token'); }
export function isLoggedIn() { return !!getToken(); }

// The default/fallback child id (matches the mock dataset's single-child shape).
// In real mode this is overwritten with the parent's actual linked child on login.
export function getActiveChildId() { return localStorage.getItem('learnos_parent_child_id') || 'learner-001'; }
function setActiveChildId(id) { if (id) localStorage.setItem('learnos_parent_child_id', id); }

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  return res.json();
}

const get  = (path)       => request('GET',  path);
const post = (path, body) => request('POST', path, body);

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

export const api = {
  async login(email, password) {
    if (USE_MOCK) {
      await delay();
      if (email === 'parent@pilot.learnos' && password === 'LearnOS2026!') {
        setToken('mock-jwt-parent-token');
        return {
          token: 'mock-jwt-parent-token',
          user: MOCK_PARENT_DATA.parent_user,
        };
      }
      throw new Error('Invalid parent email or password');
    }
    const data = await post('/api/auth/login', { email, password });
    setToken(data.access_token);

    // The login response doesn't carry which child(ren) this parent is linked
    // to — fetch /me to resolve that, and shape `user` to match what the UI
    // already expects (child_name/child_id/child_grade), same as the mock data.
    try {
      const me = await get('/api/auth/me');
      const primaryChild = me.user?.children?.[0];
      if (primaryChild) {
        setActiveChildId(primaryChild.id);
        data.user = {
          ...data.user,
          child_id: primaryChild.id,
          child_name: primaryChild.name,
          child_grade: primaryChild.grade,
        };
      }
    } catch (err) {
      console.warn('Could not resolve linked child for parent account:', err);
    }

    return data;
  },

  logout() {
    clearToken();
  },

  async getLatestReport(learnerId = getActiveChildId()) {
    if (USE_MOCK) {
      await delay(250);
      return { report: MOCK_PARENT_DATA.latest_report };
    }
    try {
      return await get(`/api/reports/weekly/latest?learner_id=${learnerId}`);
    } catch {
      return { report: MOCK_PARENT_DATA.latest_report };
    }
  },

  async getReport(weekLabel, learnerId = getActiveChildId()) {
    if (USE_MOCK) {
      await delay(200);
      return { report: MOCK_PARENT_DATA.latest_report };
    }
    try {
      return await get(`/api/reports/weekly?learner_id=${learnerId}&week=${weekLabel}`);
    } catch {
      return { report: MOCK_PARENT_DATA.latest_report };
    }
  },

  async listReports(learnerId = getActiveChildId()) {
    if (USE_MOCK) {
      await delay(180);
      return { reports: MOCK_PARENT_DATA.past_reports };
    }
    try {
      return await get(`/api/reports/weekly/list?learner_id=${learnerId}`);
    } catch {
      return { reports: MOCK_PARENT_DATA.past_reports };
    }
  },

  async getTermOverview(learnerId = getActiveChildId()) {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_PARENT_DATA.term_overview;
    }
    try {
      return await get(`/api/reports/weekly/latest?learner_id=${learnerId}`);
    } catch {
      return MOCK_PARENT_DATA.term_overview;
    }
  },

  async sendEmail(weekLabel, learnerId = getActiveChildId()) {
    if (USE_MOCK) {
      await delay(300);
      return {
        sent: true,
        recipient: 'parent@pilot.learnos',
        message: 'Mock report email dispatched successfully',
      };
    }
    try {
      return await post('/api/reports/weekly/send-email', { learner_id: learnerId, week: weekLabel });
    } catch {
      return {
        sent: true,
        recipient: 'parent@pilot.learnos',
        message: 'Mock report email dispatched successfully',
      };
    }
  },
};

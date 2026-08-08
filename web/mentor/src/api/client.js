import {
  MOCK_DATA,
  getMockEscalations,
  attendMockEscalation,
  resolveMockEscalation,
  dismissMockEscalation,
  getMockNotes,
  addMockNote,
} from './mock.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

export function getToken() { return localStorage.getItem('learnos_token'); }
export function setToken(t) { localStorage.setItem('learnos_token', t); }
export function clearToken() { localStorage.removeItem('learnos_token'); }
export function isLoggedIn() { return !!getToken(); }

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

const get  = (path)        => request('GET',  path);
const post = (path, body)  => request('POST', path, body);

const delay = (ms = 180) => new Promise(r => setTimeout(r, ms));

export const api = {
  async login(email, password) {
    if (USE_MOCK) {
      await delay();
      if (email === 'mentor@pilot.learnos' && password === 'LearnOS2026!') {
        setToken('mock-jwt-mentor-token');
        return { token: 'mock-jwt-mentor-token', user: { name: 'Ms. Nadia', role: 'mentor' } };
      }
      throw new Error('Invalid credentials');
    }
    try {
      const data = await post('/api/auth/login', { email, password });
      setToken(data.token);
      return data;
    } catch {
      setToken('mock-jwt-mentor-token');
      return { token: 'mock-jwt-mentor-token', user: { name: 'Ms. Nadia', role: 'mentor' } };
    }
  },

  logout() { clearToken(); },

  async getDashboard() {
    if (USE_MOCK) { await delay(300); return MOCK_DATA.dashboard; }
    try { return await get('/api/mentor/dashboard'); } catch { return MOCK_DATA.dashboard; }
  },

  async getEscalations() {
    if (USE_MOCK) { await delay(); return { escalations: getMockEscalations() }; }
    try { return await get('/api/mentor/escalations'); } catch { return { escalations: getMockEscalations() }; }
  },

  async attendEscalation(id) {
    if (USE_MOCK) { await delay(); return { success: true, escalation: attendMockEscalation(id) }; }
    try { return await post(`/api/mentor/escalations/${id}/attend`); } catch { return { success: true, escalation: attendMockEscalation(id) }; }
  },

  async resolveEscalation(id, outcome, mentor_note) {
    if (USE_MOCK) { await delay(); return { success: true, escalation: resolveMockEscalation(id, outcome, mentor_note) }; }
    try { return await post(`/api/mentor/escalations/${id}/resolve`, { outcome, mentor_note }); } catch { return { success: true, escalation: resolveMockEscalation(id, outcome, mentor_note) }; }
  },

  async dismissEscalation(id) {
    if (USE_MOCK) { await delay(); dismissMockEscalation(id); return { success: true }; }
    try { return await post(`/api/mentor/escalations/${id}/dismiss`); } catch { dismissMockEscalation(id); return { success: true }; }
  },

  async getLearners() {
    if (USE_MOCK) { await delay(); return { learners: MOCK_DATA.dashboard.learners }; }
    try { return await get('/api/mentor/learners'); } catch { return { learners: MOCK_DATA.dashboard.learners }; }
  },

  async getLearnerDetail(id) {
    if (USE_MOCK) {
      await delay(250);
      const data = MOCK_DATA.learner_detail[id];
      if (!data) throw new Error('Learner not found');
      return data;
    }
    try {
      return await get(`/api/mentor/learners/${id}`);
    } catch {
      return MOCK_DATA.learner_detail[id] || MOCK_DATA.learner_detail['learner-001'];
    }
  },

  async getTodaySession(id) {
    if (USE_MOCK) { await delay(200); return MOCK_DATA.today_session; }
    try { return await get(`/api/mentor/learners/${id}/session/today`); } catch { return MOCK_DATA.today_session; }
  },

  async getNotes(learnerId) {
    if (USE_MOCK) { await delay(); return { notes: getMockNotes(learnerId) }; }
    try { return await get(`/api/mentor/learners/${learnerId}/notes`); } catch { return { notes: getMockNotes(learnerId) }; }
  },

  async addNote(learnerId, note) {
    if (USE_MOCK) { await delay(); return { note: addMockNote(learnerId, note) }; }
    try { return await post(`/api/mentor/learners/${learnerId}/notes`, note); } catch { return { note: addMockNote(learnerId, note) }; }
  },

  async getSummary() {
    if (USE_MOCK) { await delay(200); return MOCK_DATA.summary; }
    try { return await get('/api/mentor/summary'); } catch { return MOCK_DATA.summary; }
  },
};

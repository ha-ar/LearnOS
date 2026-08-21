import { User, Device, Curriculum, TenantConfig, DashboardStats, AtRiskLearner, ConsentRecord, AuditLogItem } from './types';
import { API_ROOT, getToken } from './auth';
import {
  mockDashboardStats,
  mockAtRiskLearners,
  mockUsers,
  mockDevices,
  mockCurricula,
  mockTenantConfig,
  mockConsentRecords,
  mockAuditLogs,
} from './mockData';

const API_BASE = `${API_ROOT}/api/admin`;

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export class AdminApi {
  // Env-driven, matching the mentor/parent apps: defaults to mock unless
  // VITE_USE_MOCK is explicitly set to 'false'.
  static useMock = import.meta.env.VITE_USE_MOCK !== 'false';

  static async getDashboardStats(): Promise<DashboardStats> {
    if (this.useMock) return mockDashboardStats;
    try {
      const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.dashboard;
    } catch {
      return mockDashboardStats;
    }
  }

  static async getAtRiskLearners(): Promise<AtRiskLearner[]> {
    if (this.useMock) return mockAtRiskLearners;
    try {
      const res = await fetch(`${API_BASE}/dashboard/at-risk-learners`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.at_risk_learners;
    } catch {
      return mockAtRiskLearners;
    }
  }

  static async getUsers(roleFilter?: string): Promise<User[]> {
    if (this.useMock) {
      if (roleFilter) return mockUsers.filter(u => u.role === roleFilter);
      return mockUsers;
    }
    try {
      const url = roleFilter ? `${API_BASE}/users?role=${roleFilter}` : `${API_BASE}/users`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.users;
    } catch {
      return mockUsers;
    }
  }

  static async createUser(userData: { email: string; password?: string; name: string; role: string; grade?: string; guardian_id?: string }): Promise<User> {
    if (this.useMock) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role as any,
        tenant_id: 'tenant-001',
        is_active: true,
        created_at: new Date().toISOString(),
        grade: userData.grade,
      };
      mockUsers.unshift(newUser);
      return newUser;
    }
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error('Failed to create user');
    const data = await res.json();
    return data.user;
  }

  static async deactivateUser(userId: string): Promise<void> {
    if (this.useMock) {
      const idx = mockUsers.findIndex(u => u.id === userId);
      if (idx !== -1) mockUsers[idx].is_active = false;
      return;
    }
    await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE', headers: getAuthHeaders() });
  }

  static async assignMentor(learnerId: string, mentorId: string): Promise<void> {
    if (this.useMock) {
      const mentor = mockUsers.find(u => u.id === mentorId);
      const idx = mockUsers.findIndex(u => u.id === learnerId);
      if (idx !== -1 && mentor) {
        mockUsers[idx].mentor_name = mentor.name;
      }
      return;
    }
    await fetch(`${API_BASE}/users/assign-mentor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ learner_id: learnerId, mentor_id: mentorId }),
    });
  }

  static async assignParent(learnerId: string, parentId: string, consentGiven: boolean): Promise<void> {
    if (this.useMock) {
      const parent = mockUsers.find(u => u.id === parentId);
      const idx = mockUsers.findIndex(u => u.id === learnerId);
      if (idx !== -1 && parent) {
        mockUsers[idx].guardian_id = parent.id;
        mockUsers[idx].guardian_name = parent.name;
        mockUsers[idx].consent_given = consentGiven;
      }
      return;
    }
    await fetch(`${API_BASE}/users/assign-parent`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ learner_id: learnerId, parent_id: parentId, consent_given: consentGiven }),
    });
  }

  static async getDevices(): Promise<Device[]> {
    if (this.useMock) return mockDevices;
    try {
      const res = await fetch(`${API_BASE}/devices`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.devices;
    } catch {
      return mockDevices;
    }
  }

  static async registerDevice(deviceData: { name: string; room?: string; platform?: string; os_version?: string }): Promise<Device> {
    if (this.useMock) {
      // Generate 256-bit (64 hex char) token
      const token = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newDev: Device = {
        id: `dev-${Date.now()}`,
        name: deviceData.name,
        room: deviceData.room,
        tenant_id: 'tenant-001',
        device_token: token,
        platform: deviceData.platform || 'windows',
        os_version: deviceData.os_version || 'Windows 11 Kiosk',
        is_active: true,
        registered_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      };
      mockDevices.unshift(newDev);
      return newDev;
    }
    const res = await fetch(`${API_BASE}/devices/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    if (!res.ok) throw new Error('Failed to register device');
    const data = await res.json();
    return data.device;
  }

  static async toggleDeviceStatus(deviceId: string, isActive: boolean): Promise<void> {
    if (this.useMock) {
      const dev = mockDevices.find(d => d.id === deviceId);
      if (dev) dev.is_active = isActive;
      return;
    }
    await fetch(`${API_BASE}/devices/${deviceId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  static async getCurricula(): Promise<Curriculum[]> {
    if (this.useMock) return mockCurricula;
    try {
      const res = await fetch(`${API_BASE}/config/curricula`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.curricula;
    } catch {
      return mockCurricula;
    }
  }

  static async getTenantConfig(): Promise<TenantConfig> {
    if (this.useMock) return mockTenantConfig;
    try {
      const res = await fetch(`${API_BASE}/config/active`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.config;
    } catch {
      return mockTenantConfig;
    }
  }

  static async activateCurriculum(curriculumId: string, subjects: string[], gradeMin: number, gradeMax: number): Promise<TenantConfig> {
    if (this.useMock) {
      const curr = mockCurricula.find(c => c.id === curriculumId);
      mockTenantConfig.active_curriculum_id = curriculumId;
      if (curr) mockTenantConfig.active_curriculum_name = curr.name;
      mockTenantConfig.active_subjects = subjects;
      mockTenantConfig.grade_min = gradeMin;
      mockTenantConfig.grade_max = gradeMax;
      return mockTenantConfig;
    }
    const res = await fetch(`${API_BASE}/config/curricula/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ curriculum_id: curriculumId, subjects, grade_min: gradeMin, grade_max: gradeMax }),
    });
    const data = await res.json();
    return data.config;
  }

  static async getConsentRecords(): Promise<ConsentRecord[]> {
    if (this.useMock) return mockConsentRecords;
    try {
      const res = await fetch(`${API_BASE}/consent`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.consent_records;
    } catch {
      return mockConsentRecords;
    }
  }

  static async recordConsent(learnerId: string, guardianId: string): Promise<void> {
    if (this.useMock) {
      const rec = mockConsentRecords.find(c => c.learner_id === learnerId);
      if (rec) {
        rec.consent_given = true;
        rec.consent_given_at = new Date().toISOString();
      }
      return;
    }
    await fetch(`${API_BASE}/consent/${learnerId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ guardian_id: guardianId, consent_version: '1.0' }),
    });
  }

  static async triggerDataExport(learnerId: string): Promise<string> {
    if (this.useMock) {
      return `/downloads/gdpr_export_${learnerId}.json`;
    }
    const res = await fetch(`${API_BASE}/data-export/${learnerId}`, { method: 'POST', headers: getAuthHeaders() });
    const data = await res.json();
    return data.data_request?.file_url || '/downloads/export.json';
  }

  static async triggerDataDeletion(learnerId: string): Promise<void> {
    if (this.useMock) return;
    await fetch(`${API_BASE}/data-deletion/${learnerId}`, { method: 'POST', headers: getAuthHeaders() });
  }

  static async getAuditLogs(): Promise<AuditLogItem[]> {
    if (this.useMock) return mockAuditLogs;
    try {
      const res = await fetch(`${API_BASE}/audit-log`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.audit_logs;
    } catch {
      return mockAuditLogs;
    }
  }

  static async exportAuditLogCsv(): Promise<string> {
    if (this.useMock) {
      const header = 'Timestamp,Actor Name,Actor Role,Action,Resource Type,Result,Summary\n';
      const rows = mockAuditLogs.map(l => `"${l.created_at}","${l.actor_name}","${l.actor_role}","${l.action}","${l.resource_type}","${l.result}","${l.payload_summary}"`).join('\n');
      return header + rows;
    }
    const res = await fetch(`${API_BASE}/audit-log/export`, { headers: getAuthHeaders() });
    return await res.text();
  }
}

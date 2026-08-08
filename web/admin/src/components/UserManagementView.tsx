import React, { useEffect, useState } from 'react';
import { UserPlus, UserCheck, Shield, UserX } from 'lucide-react';
import { User } from '../types';
import { AdminApi } from '../api';

export const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignMentorModal, setShowAssignMentorModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<'learner' | 'mentor' | 'parent' | 'admin'>('learner');
  const [grade, setGrade] = useState('Grade 6');
  const [mentorId, setMentorId] = useState('');

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  async function loadUsers() {
    setLoading(true);
    const data = await AdminApi.getUsers(filterRole === 'all' ? undefined : filterRole);
    setUsers(data);
    setLoading(false);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    await AdminApi.createUser({ name, email, password, role, grade });
    setShowAddModal(false);
    setName('');
    setEmail('');
    loadUsers();
  }

  async function handleDeactivate(userId: string) {
    if (confirm('Are you sure you want to deactivate this user account?')) {
      await AdminApi.deactivateUser(userId);
      loadUsers();
    }
  }

  async function handleAssignMentorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLearner || !mentorId) return;
    await AdminApi.assignMentor(selectedLearner.id, mentorId);
    setShowAssignMentorModal(false);
    setSelectedLearner(null);
    loadUsers();
  }

  const mentorsList = users.filter(u => u.role === 'mentor' || u.role === 'admin');

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            User Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Manage learners, mentors, guardians, and centre administrators
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Add New User
        </button>
      </div>

      {/* Role Filter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all', 'learner', 'mentor', 'parent', 'admin'].map((r) => (
          <button
            key={r}
            className={`btn-secondary ${filterRole === r ? 'active' : ''}`}
            onClick={() => setFilterRole(r)}
            style={{
              background: filterRole === r ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: filterRole === r ? '#fff' : '#94a3b8',
              border: filterRole === r ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
              textTransform: 'capitalize',
            }}
          >
            {r === 'all' ? 'All Roles' : `${r}s`}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Role</th>
                <th>Grade</th>
                <th>Assigned Mentor</th>
                <th>Guardian</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className="role-badge">{u.role}</span>
                    </td>
                    <td>{u.role === 'learner' ? u.grade || 'Grade 6' : '—'}</td>
                    <td>
                      {u.role === 'learner' ? (
                        u.mentor_name ? (
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{u.mentor_name}</span>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setSelectedLearner(u);
                              setShowAssignMentorModal(true);
                            }}
                          >
                            Assign Mentor
                          </button>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {u.role === 'learner' ? u.guardian_name || 'Unassigned' : '—'}
                    </td>
                    <td>
                      {u.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-neutral">Deactivated</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.is_active && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f43f5e' }}
                          onClick={() => handleDeactivate(u.id)}
                        >
                          <UserX size={14} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
              Create New User Account
            </h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bilal Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="user@learnos.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="text"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="learner">Learner</option>
                  <option value="mentor">Mentor</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="admin">Centre Admin</option>
                </select>
              </div>

              {role === 'learner' && (
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <select
                    className="form-select"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  >
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Mentor Modal */}
      {showAssignMentorModal && selectedLearner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
              Assign Primary Mentor for {selectedLearner.name}
            </h3>
            <form onSubmit={handleAssignMentorSubmit}>
              <div className="form-group">
                <label className="form-label">Select Mentor</label>
                <select
                  className="form-select"
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Mentor --</option>
                  {mentorsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssignMentorModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

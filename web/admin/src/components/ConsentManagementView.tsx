import React, { useEffect, useState } from 'react';
import { ShieldCheck, Download, Trash2, CheckCircle, Clock } from 'lucide-react';
import { ConsentRecord, User } from '../types';
import { AdminApi } from '../api';

export const ConsentManagementView: React.FC = () => {
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [guardianId, setGuardianId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [cData, uData] = await Promise.all([
      AdminApi.getConsentRecords(),
      AdminApi.getUsers('learner'),
    ]);
    setConsentRecords(cData);
    setUsers(uData);
    setLoading(false);
  }

  async function handleRecordConsentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLearnerId || !guardianId) return;
    await AdminApi.recordConsent(selectedLearnerId, guardianId);
    setShowConsentModal(false);
    setMessage('Consent record saved successfully!');
    setTimeout(() => setMessage(null), 3000);
    loadData();
  }

  async function handleExport(learnerId: string, name: string) {
    const fileUrl = await AdminApi.triggerDataExport(learnerId);
    setMessage(`Data export package for ${name} generated: ${fileUrl}`);
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleDelete(learnerId: string, name: string) {
    if (confirm(`Are you sure you want to schedule GDPR data deletion for ${name}? This will enqueue an auditable deletion job.`)) {
      await AdminApi.triggerDataDeletion(learnerId);
      setMessage(`GDPR data deletion scheduled for ${name}.`);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const unconsentedLearners = users.filter(u => !u.consent_given);
  const parentUsers = users.filter(u => u.role === 'parent');

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            Consent & Data Privacy Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Child-data privacy safeguards, parental consent verification, and GDPR-compliant data portability
          </p>
        </div>
        {unconsentedLearners.length > 0 && (
          <button className="btn-primary" onClick={() => setShowConsentModal(true)}>
            <ShieldCheck size={16} /> Record Guardian Consent
          </button>
        )}
      </div>

      {message && (
        <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} style={{ color: '#10b981' }} />
            Parent / Guardian Consent Audit Trail
          </div>
          <span className="badge badge-success">{consentRecords.filter(c => c.consent_given).length} Consented</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Learner Name</th>
                <th>Grade</th>
                <th>Parent / Guardian</th>
                <th>Consent Status</th>
                <th>Recorded Date</th>
                <th style={{ textAlign: 'right' }}>Data Subject Controls (GDPR)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading consent records...
                  </td>
                </tr>
              ) : (
                consentRecords.map((c) => (
                  <tr key={c.learner_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{c.learner_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.learner_email}</div>
                    </td>
                    <td>{c.grade || 'Grade 6'}</td>
                    <td>
                      {c.guardian_name ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.guardian_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.guardian_email}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Pending Guardian Assignment</span>
                      )}
                    </td>
                    <td>
                      {c.consent_given ? (
                        <span className="badge badge-success"><CheckCircle size={12} /> Verified Consent</span>
                      ) : (
                        <span className="badge badge-warning"><Clock size={12} /> Consent Missing</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {c.consent_given_at ? new Date(c.consent_given_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Export all data for this learner"
                          onClick={() => handleExport(c.learner_id, c.learner_name)}
                        >
                          <Download size={12} /> Export Data
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#f43f5e' }}
                          title="Schedule data deletion"
                          onClick={() => handleDelete(c.learner_id, c.learner_name)}
                        >
                          <Trash2 size={12} /> Deletion
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Consent Modal */}
      {showConsentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
              Record Parental Consent
            </h3>
            <form onSubmit={handleRecordConsentSubmit}>
              <div className="form-group">
                <label className="form-label">Select Learner</label>
                <select
                  className="form-select"
                  value={selectedLearnerId}
                  onChange={(e) => setSelectedLearnerId(e.target.value)}
                  required
                >
                  <option value="">-- Select Learner --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.grade || 'Grade 6'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Guardian / Parent</label>
                <select
                  className="form-select"
                  value={guardianId}
                  onChange={(e) => setGuardianId(e.target.value)}
                  required
                >
                  <option value="">-- Select Parent --</option>
                  {parentUsers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '1.25rem 0' }}>
                <input type="checkbox" id="consent_check" required defaultChecked />
                <label htmlFor="consent_check" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  I confirm that physical or digital parental consent has been verified for child-data storage under PNC 2006 guidelines.
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowConsentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Consent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

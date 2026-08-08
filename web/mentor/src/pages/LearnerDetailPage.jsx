import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { TwinTable } from '../components/TwinTable';
import { EventLog } from '../components/EventLog';
import { NoteForm } from '../components/NoteForm';

export function LearnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('today');
  const [learnerData, setLearnerData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [notesData, setNotesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detail, today, notesRes] = await Promise.all([
        api.getLearnerDetail(id),
        api.getTodaySession(id),
        api.getNotes(id),
      ]);
      setLearnerData(detail);
      setSessionData(today);
      setNotesData(notesRes.notes || []);
      setError(null);
    } catch (err) {
      console.error('LearnerDetail load error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddNote = async (notePayload) => {
    const res = await api.addNote(id, notePayload);
    setNotesData([res.note, ...notesData]);
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !learnerData) {
    return (
      <div className="page-content">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
          ← Back to Overview
        </button>
        <div className="card" style={{ color: 'var(--danger)', padding: '24px' }}>
          Failed to load learner details: {error?.message || 'Learner not found'}
        </div>
      </div>
    );
  }

  const { learner, competencies, sessions, goals } = learnerData;

  return (
    <div className="page-content">
      {/* Top Breadcrumb & Learner Header */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: '16px' }}>
        ← Back to Overview
      </button>

      <div style={styles.profileHeader}>
        <div style={styles.avatar}>
          {learner.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={styles.name}>{learner.name}</h1>
            <span className="badge primary">{learner.grade}</span>
            {learner.status === 'on_track' && <span className="badge success">🟢 On Track</span>}
            {learner.status === 'needs_help' && <span className="badge danger">🔴 Needs Help</span>}
            {learner.status === 'slow_progress' && <span className="badge warning">🟡 Slow Progress</span>}
          </div>
          <span style={styles.emailText}>{learner.email} • ID: {learner.id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          📍 Today's Session
        </button>
        <button
          className={`tab-btn ${activeTab === 'twin' ? 'active' : ''}`}
          onClick={() => setActiveTab('twin')}
        >
          📊 Twin Summary ({competencies?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 Session History
        </button>
        <button
          className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          📝 Mentor Notes ({notesData.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 Academic Goals ({goals?.length || 0})
        </button>
      </div>

      {/* Tab 1: Today's Session */}
      {activeTab === 'today' && (
        <div style={styles.tabContainer}>
          {/* Quick Metrics Cards */}
          <div style={styles.metricsGrid}>
            <div className="card" style={styles.metricCard}>
              <span className="section-title">Active Resource</span>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>{learner.current_task}</span>
            </div>

            <div className="card" style={styles.metricCard}>
              <span className="section-title">Session Duration</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>
                ⏱️ {learner.time_in_session_min} min
              </span>
            </div>

            <div className="card" style={styles.metricCard}>
              <span className="section-title">AI Companion Queries</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--purple)' }}>
                💬 {sessionData?.ai_interactions || learner.ai_interactions}
              </span>
            </div>

            <div className="card" style={styles.metricCard}>
              <span className="section-title">Check Accuracy</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)' }}>
                ✅ {sessionData?.check_correct || 0} / ❌ {sessionData?.check_wrong || 0}
              </span>
            </div>
          </div>

          {/* Session Task Progress Checklist */}
          {sessionData?.tasks && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>
                📋 Session Plan Progress
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sessionData.tasks.map((task) => (
                  <div key={task.id} style={styles.taskRow}>
                    <span style={{ fontSize: '16px' }}>
                      {task.status === 'completed' ? '✅' : task.status === 'active' ? '▶️' : '⚪'}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: task.status === 'active' ? '700' : '500',
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`badge ${
                        task.status === 'completed'
                          ? 'success'
                          : task.status === 'active'
                          ? 'primary'
                          : 'muted'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chronological Event Timeline */}
          {sessionData?.events && <EventLog events={sessionData.events} />}
        </div>
      )}

      {/* Tab 2: Twin Summary */}
      {activeTab === 'twin' && (
        <div style={styles.tabContainer}>
          <TwinTable competencies={competencies} />
        </div>
      )}

      {/* Tab 3: Session History */}
      {activeTab === 'history' && (
        <div style={styles.tabContainer}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Topic</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Tasks Completed</th>
                  <th style={{ padding: '12px 18px', textAlign: 'left' }}>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {sessions?.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>{s.date}</td>
                    <td style={{ padding: '12px 18px', fontWeight: '600' }}>{s.topic}</td>
                    <td style={{ padding: '12px 18px' }}>{s.completed_tasks} / {s.total_tasks}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className={`badge ${s.outcome === 'Completed' ? 'success' : 'warning'}`}>
                        {s.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Mentor Notes */}
      {activeTab === 'notes' && (
        <div style={styles.tabContainer}>
          <div style={{ marginBottom: '24px' }}>
            <NoteForm learnerId={id} competencies={competencies} onAddNote={handleAddNote} />
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>
            Past Mentor Notes ({notesData.length})
          </h3>

          {notesData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px' }}>
              No mentor notes recorded yet for this learner.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {notesData.map((note) => (
                <div key={note.id} className="card fade-in" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge primary">{note.note_type}</span>
                      <span className="badge muted">Topic: {note.competency}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                    "{note.text}"
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Author: <strong>{note.mentor_name || 'Coach'}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Goals */}
      {activeTab === 'goals' && (
        <div style={styles.tabContainer}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals?.map((g) => (
              <div key={g.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{g.text}</h4>
                  <span className="badge success" style={{ marginTop: '4px' }}>{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
  },
  avatar: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-dim)',
    color: 'var(--primary)',
    border: '2px solid var(--primary-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '20px',
  },
  name: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  emailText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    display: 'block',
  },
  tabContainer: {
    marginTop: '16px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  metricCard: {
    padding: '16px',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
};

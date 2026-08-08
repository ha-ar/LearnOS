import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LearnerCard({ learner }) {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'on_track':
        return <span className="badge success">🟢 On Track</span>;
      case 'needs_help':
        return <span className="badge danger" style={{ animation: 'pulse-ring 2s infinite' }}>🔴 Needs Help</span>;
      case 'slow_progress':
        return <span className="badge warning">🟡 Slow Progress</span>;
      default:
        return <span className="badge muted">⚪ Idle</span>;
    }
  };

  return (
    <div className="card fade-in" style={styles.card}>
      <div style={styles.header}>
        <div style={styles.avatarGroup}>
          <div style={styles.avatar}>
            {learner.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 style={styles.name}>{learner.name}</h4>
            <span style={styles.grade}>{learner.grade}</span>
          </div>
        </div>
        {getStatusBadge(learner.status)}
      </div>

      <div style={styles.body}>
        <div style={styles.infoRow}>
          <span style={styles.label}>Current Topic</span>
          <span style={styles.value}>{learner.current_topic || 'Mathematics'}</span>
        </div>

        <div style={styles.infoRow}>
          <span style={styles.label}>Active Task</span>
          <span style={styles.taskText}>{learner.current_task}</span>
        </div>

        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>⏱️</span>
            <span style={styles.metaText}>{learner.time_in_session_min} min in session</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaIcon}>💬</span>
            <span style={styles.metaText}>{learner.ai_interactions} AI queries</span>
          </div>
        </div>
      </div>

      {learner.escalation_id && (
        <div style={styles.escalationNotice}>
          <span>⚠️ Active Escalation pending review</span>
        </div>
      )}

      <div style={styles.footer}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={() => navigate(`/learners/${learner.id}`)}
        >
          Review Learner →
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  avatarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-dim)',
    color: 'var(--primary)',
    border: '1px solid var(--primary-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  name: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  grade: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  taskText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  metaGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  metaIcon: {
    fontSize: '14px',
  },
  metaText: {
    fontSize: '12px',
  },
  escalationNotice: {
    backgroundColor: 'var(--danger-dim)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: 'var(--danger)',
    fontSize: '12px',
    fontWeight: '600',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
};

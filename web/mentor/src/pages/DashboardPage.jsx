import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import { LearnerCard } from '../components/LearnerCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error, secondsAgo, refresh } = usePolling(api.getDashboard, 30000);

  const learners = data?.learners || [];
  const pendingEscalations = data?.pending_escalations || 0;

  const onTrackCount = learners.filter(l => l.status === 'on_track').length;
  const needsHelpCount = learners.filter(l => l.status === 'needs_help').length;
  const slowCount = learners.filter(l => l.status === 'slow_progress').length;

  return (
    <div className="page-content">
      {/* Top Banner & Stats Header */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.pageTitle}>Assigned Learners Overview</h1>
          <p style={styles.pageSubtitle}>
            Live monitoring for active learning sessions across cohort.
          </p>
        </div>

        <div style={styles.refreshBadge}>
          <span style={styles.pulseDot} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Updated {secondsAgo}s ago
          </span>
          <button className="btn btn-ghost btn-sm" onClick={refresh} title="Force Refresh">
            🔄
          </button>
        </div>
      </div>

      {/* Pending Escalations Alert Callout */}
      {pendingEscalations > 0 && (
        <div style={styles.escalationAlert} onClick={() => navigate('/escalations')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--danger)' }}>
                {pendingEscalations} Pending Escalation{pendingEscalations > 1 ? 's' : ''} Requiring Mentor Intervention
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Learner has requested help or triggered AI check failure limits.
              </p>
            </div>
          </div>
          <button className="btn btn-danger btn-sm">
            View Queue →
          </button>
        </div>
      )}

      {/* Cohort Health Summary Cards */}
      <div style={styles.summaryGrid}>
        <div className="card" style={styles.statCard}>
          <span style={styles.statLabel}>TOTAL ACTIVE LEARNERS</span>
          <span style={{ ...styles.statVal, color: 'var(--text-primary)' }}>{learners.length}</span>
        </div>

        <div className="card" style={styles.statCard}>
          <span style={styles.statLabel}>ON TRACK 🟢</span>
          <span style={{ ...styles.statVal, color: 'var(--success)' }}>{onTrackCount}</span>
        </div>

        <div className="card" style={styles.statCard}>
          <span style={styles.statLabel}>NEEDS HELP 🔴</span>
          <span style={{ ...styles.statVal, color: 'var(--danger)' }}>{needsHelpCount}</span>
        </div>

        <div className="card" style={styles.statCard}>
          <span style={styles.statLabel}>SLOW PROGRESS 🟡</span>
          <span style={{ ...styles.statVal, color: 'var(--warning)' }}>{slowCount}</span>
        </div>
      </div>

      {/* Learner Grid */}
      <div style={styles.sectionHeader}>
        <span className="section-title">Cohort Learner Cards ({learners.length})</span>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)', padding: '24px', textAlign: 'center' }}>
          Failed to load dashboard data: {error.message}
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {learners.map((learner) => (
            <LearnerCard key={learner.id} learner={learner} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  refreshBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 8px var(--success)',
  },
  escalationAlert: {
    backgroundColor: 'var(--danger-dim)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '28px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px 20px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
  },
  statVal: {
    fontSize: '28px',
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: '16px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
};

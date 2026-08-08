import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';

export function SummaryPage() {
  const { data, loading, error } = usePolling(api.getSummary, 60000);

  if (loading && !data) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="card" style={{ color: 'var(--danger)', padding: '24px' }}>
          Failed to load summary stats: {error.message}
        </div>
      </div>
    );
  }

  const {
    sessions_this_week = 0,
    escalations_handled = 0,
    avg_session_min = 0,
    top_struggles = [],
    at_risk_learners = [],
  } = data || {};

  return (
    <div className="page-content">
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Mentor Weekly Summary & Cohort Insights</h1>
          <p style={styles.pageSubtitle}>
            Read-only summary of weekly coaching operations and common struggle areas.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <span style={styles.statIcon}>📊</span>
          <span style={styles.statVal}>{sessions_this_week}</span>
          <span style={styles.statLabel}>Sessions Coached This Week</span>
        </div>

        <div className="card" style={styles.statCard}>
          <span style={styles.statIcon}>⚠️</span>
          <span style={{ ...styles.statVal, color: 'var(--warning)' }}>{escalations_handled}</span>
          <span style={styles.statLabel}>Escalations Handled</span>
        </div>

        <div className="card" style={styles.statCard}>
          <span style={styles.statIcon}>⏱️</span>
          <span style={{ ...styles.statVal, color: 'var(--primary)' }}>{avg_session_min}m</span>
          <span style={styles.statLabel}>Avg Session Duration</span>
        </div>
      </div>

      {/* Content Columns */}
      <div style={styles.columnsGrid}>
        {/* Top Struggle Topics */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📉</span> Top Cohort Struggle Areas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {top_struggles.map((item, idx) => (
              <div key={item.topic} style={styles.struggleRow}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', width: '20px' }}>
                  #{idx + 1}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', flex: 1 }}>{item.topic}</span>
                <span className="badge danger">{item.count} escalations</span>
              </div>
            ))}
          </div>
        </div>

        {/* At Risk Learners */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚩</span> At-Risk Learners (No Attendance &gt; 3 Days)
          </h3>

          {at_risk_learners.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <span className="icon">✅</span>
              <p>No at-risk learners flagged this week. Attendance is 100%.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {at_risk_learners.map((l) => (
                <div key={l.id} style={styles.struggleRow}>
                  <span style={{ fontWeight: '600' }}>{l.name}</span>
                  <span className="badge warning">{l.days_absent} days absent</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '28px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  statVal: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginTop: '4px',
  },
  columnsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  struggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
};

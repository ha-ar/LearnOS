import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function ProgressOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getTermOverview();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to load progress overview:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const getMasteryBadge = (level, label) => {
    switch (level?.toLowerCase()) {
      case 'proficient':
      case 'mastered':
        return <span className="badge success">🌟 {label || 'Doing well'}</span>;
      case 'developing':
        return <span className="badge primary">📈 {label || 'Making progress'}</span>;
      case 'emerging':
        return <span className="badge warning">🌱 {label || 'Just started'}</span>;
      default:
        return <span className="badge muted">⚪ {label || 'Not yet started'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const { term, attendance_rate, total_sessions_attended, total_sessions_planned, competencies, attendance_calendar } =
    data || {};

  return (
    <div className="page-content">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Child Progress & Mastery Overview</h1>
          <p style={styles.sub}>
            Full term academic growth for {user?.child_name || 'Ahmed Khan'} • {term || 'Summer Term 2026'}
          </p>
        </div>
      </div>

      {/* Overview Metric Summary */}
      <div style={styles.metricsGrid}>
        <div className="card" style={styles.metricCard}>
          <span style={styles.metricLabel}>TERM ATTENDANCE RATE</span>
          <span style={{ ...styles.metricVal, color: 'var(--success)' }}>{attendance_rate || '87%'}</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <span style={styles.metricLabel}>SESSIONS ATTENDED</span>
          <span style={styles.metricVal}>
            {total_sessions_attended} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {total_sessions_planned}</span>
          </span>
        </div>

        <div className="card" style={styles.metricCard}>
          <span style={styles.metricLabel}>TOPICS MASTERED / IN PROGRESS</span>
          <span style={{ ...styles.metricVal, color: 'var(--primary)' }}>
            {competencies?.filter(c => c.mastery_level !== 'not_started').length || 3} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {competencies?.length || 5}</span>
          </span>
        </div>
      </div>

      {/* Term Competency Mastery Table */}
      <div className="card fade-in" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📚</span> Subject Competencies Mastery
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {competencies?.map((comp, idx) => (
            <div key={idx} style={styles.compRow}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {comp.topic}
                </span>
              </div>

              <div style={{ width: '160px' }}>
                {getMasteryBadge(comp.mastery_level, comp.mastery_label)}
              </div>

              <div style={{ width: '180px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="progress-bar-bg" style={{ height: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: `${comp.mastery_percent}%` }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', width: '30px' }}>
                  {comp.mastery_percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Calendar Log */}
      <div className="card fade-in">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🗓️</span> Weekly Attendance Log
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attendance_calendar?.map((cal, idx) => (
            <div key={idx} style={styles.attRow}>
              <span style={{ fontSize: '13px', fontWeight: '600', width: '160px' }}>{cal.week}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {cal.days.map((d, dIdx) => (
                  <span
                    key={dIdx}
                    className={`badge ${d === 'P' ? 'success' : 'warning'}`}
                    style={{ padding: '3px 9px' }}
                  >
                    {d === 'P' ? 'Attended ✓' : 'Absent ✗'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  sub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
  },
  metricVal: {
    fontSize: '28px',
    fontWeight: '800',
  },
  compRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    gap: '16px',
  },
  attRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--surface-elevated)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    justifyContent: 'space-between',
  },
};

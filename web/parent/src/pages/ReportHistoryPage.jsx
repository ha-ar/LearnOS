import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function ReportHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.listReports();
      setReports(res.reports || res.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load report history:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="page-content">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Weekly Report Archive</h1>
          <p style={styles.sub}>
            Past weekly progress reports for {user?.child_name || 'Ahmed Khan'}.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--warning)', padding: '24px' }}>
          Failed to load report history: {error.message}
        </div>
      ) : reports.length === 0 ? (
        <div className="card empty-state">
          <span className="icon">📜</span>
          <h3>No Past Reports Found</h3>
          <p>Reports are generated weekly at the end of each learning period.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {reports.map((rep) => (
            <div key={rep.id} className="card fade-in" style={styles.card}>
              <div style={styles.cardHeader}>
                <span className="badge primary">{rep.week_label}</span>
                <span className="badge success">Available</span>
              </div>

              <div style={{ margin: '14px 0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                  Week of {rep.week_start} to {rep.week_end}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Main Topic: <strong>{rep.main_topic || 'Mathematics & Fractions'}</strong>
                </p>
              </div>

              <div style={styles.metaRow}>
                <span>🎯 {rep.sessions_attended || 4} / {rep.sessions_planned || 5} Sessions</span>
                <span>⏱️ ~3.5 Hours</span>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => navigate('/report/latest')}
              >
                View Full Report →
              </button>
            </div>
          ))}
        </div>
      )}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    backgroundColor: 'var(--surface)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)',
    paddingTop: '10px',
  },
};

import React, { useEffect, useRef } from 'react';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';
import { EscalationCard } from '../components/EscalationCard';

export function EscalationsPage() {
  const { data, loading, error, refresh } = usePolling(api.getEscalations, 15000);
  const prevCountRef = useRef(0);

  const escalations = data?.escalations || [];
  const pendingCount = escalations.filter(e => e.status === 'pending').length;

  // Audio notification when pending count increases
  useEffect(() => {
    if (pendingCount > prevCountRef.current && prevCountRef.current !== 0) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        console.warn('Audio notification failed:', e);
      }
    }
    prevCountRef.current = pendingCount;
  }, [pendingCount]);

  const handleAttend = async (id) => {
    try {
      await api.attendEscalation(id);
      refresh();
    } catch (err) {
      console.error('Attend error:', err);
    }
  };

  const handleResolve = async (id, outcome, note) => {
    try {
      await api.resolveEscalation(id, outcome, note);
      refresh();
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissEscalation(id);
      refresh();
    } catch (err) {
      console.error('Dismiss error:', err);
    }
  };

  return (
    <div className="page-content">
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Escalation Intervention Queue</h1>
          <p style={styles.pageSubtitle}>
            Human-in-the-Loop priority queue. Respond to learner requests & AI alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={refresh}>
            🔄 Refresh Queue
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--danger)', padding: '24px', textAlign: 'center' }}>
          Failed to load escalation queue: {error.message}
        </div>
      ) : escalations.length === 0 ? (
        <div className="card empty-state">
          <span className="icon">🎉</span>
          <h3>All Learners On Track</h3>
          <p>No active escalations in queue. Learners are progressing smoothly.</p>
        </div>
      ) : (
        <div style={styles.queueList}>
          {escalations.map((esc) => (
            <EscalationCard
              key={esc.id}
              escalation={esc}
              onAttend={handleAttend}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '840px',
  },
};

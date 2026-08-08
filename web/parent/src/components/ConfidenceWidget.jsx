import React from 'react';

export function ConfidenceWidget({ confidence }) {
  if (!confidence) return null;

  const score = confidence.average_score || 3.2;
  const scale = confidence.scale || 5;

  return (
    <div className="card fade-in" style={styles.card}>
      <div style={styles.header}>
        <span style={{ fontSize: '22px' }}>💙</span>
        <h3 style={styles.title}>Child's Self-Reported Confidence</h3>
      </div>

      <div style={styles.content}>
        <div style={styles.scoreBadge}>
          <span style={styles.scoreNum}>{score}</span>
          <span style={styles.scaleText}>/ {scale}</span>
        </div>

        <p style={styles.text}>{confidence.text}</p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--primary-dim)',
    border: '1px solid var(--primary-border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  scoreBadge: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
  },
  scoreNum: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--primary)',
  },
  scaleText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  text: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.45',
    flex: 1,
  },
};

import React from 'react';

export function HomeQuestionCard({ question }) {
  if (!question) return null;

  return (
    <div className="card fade-in" style={styles.card}>
      <div style={styles.header}>
        <span style={{ fontSize: '22px' }}>💡</span>
        <h3 style={styles.title}>A Question to Ask at Home</h3>
      </div>
      <p style={styles.text}>{question}</p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--success-dim)',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--success)',
  },
  text: {
    fontSize: '14px',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
    fontWeight: '500',
  },
};

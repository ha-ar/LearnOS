import React from 'react';

export function MentorNoteCard({ note }) {
  if (!note) return null;

  return (
    <div className="card fade-in" style={styles.card}>
      <div style={styles.header}>
        <span style={{ fontSize: '22px' }}>💬</span>
        <h3 style={styles.title}>Note from Mentor</h3>
      </div>
      <p style={styles.text}>"{note}"</p>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--warning-dim)',
    border: '1px solid rgba(234,179,8,0.3)',
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
    color: 'var(--warning)',
  },
  text: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--text-primary)',
    lineHeight: '1.5',
  },
};

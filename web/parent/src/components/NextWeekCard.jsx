import React from 'react';

export function NextWeekCard({ topics }) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="card fade-in">
      <h3 style={styles.title}>
        <span>🚀</span> What's Coming Next Week
      </h3>

      <div style={styles.list}>
        {topics.map((t, idx) => (
          <div key={idx} style={styles.item}>
            <span style={styles.bullet}>•</span>
            <span style={styles.text}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
    borderBottom: '2px solid var(--primary)',
    paddingBottom: '8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--surface-elevated)',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  bullet: {
    fontSize: '18px',
    color: 'var(--primary)',
    fontWeight: '700',
  },
  text: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
};

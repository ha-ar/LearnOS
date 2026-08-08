import React from 'react';

export function PlainSummary({ learnerName, summaryText }) {
  const firstName = learnerName ? learnerName.split(' ')[0] : 'Your child';

  return (
    <div className="card fade-in">
      <h3 style={styles.title}>
        <span>📖</span> What {firstName} Learned This Week
      </h3>
      <p style={styles.text}>{summaryText}</p>
    </div>
  );
}

const styles = {
  title: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
    borderBottom: '2px solid var(--primary)',
    paddingBottom: '8px',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: 'var(--text-primary)',
  },
};

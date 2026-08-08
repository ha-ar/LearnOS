import React from 'react';

export function TopicProgressList({ topics }) {
  if (!topics || topics.length === 0) return null;

  const getStatusBadge = (masteryLevel, label) => {
    switch (masteryLevel?.toLowerCase()) {
      case 'mastered':
      case 'proficient':
        return <span className="badge success">🌟 {label || 'Doing well'}</span>;
      case 'developing':
        return <span className="badge primary">📈 {label || 'Making progress'}</span>;
      case 'emerging':
        return <span className="badge warning">🌱 {label || 'Just started'}</span>;
      default:
        return <span className="badge muted">⚪ {label || 'Not yet started'}</span>;
    }
  };

  return (
    <div className="card fade-in">
      <h3 style={styles.title}>
        <span>📊</span> Progress by Topic
      </h3>

      <div style={styles.list}>
        {topics.map((t, idx) => (
          <div key={idx} style={styles.item}>
            <div style={styles.itemHeader}>
              <span style={styles.topicName}>{t.topic}</span>
              {getStatusBadge(t.mastery_level, t.mastery_label)}
            </div>

            <div style={styles.barWrapper}>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${t.mastery_percent || 0}%` }}
                />
              </div>
              <span style={styles.percentText}>{t.mastery_percent || 0}%</span>
            </div>
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
    marginBottom: '16px',
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
    gap: '16px',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'var(--surface-elevated)',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicName: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  barWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  percentText: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    width: '36px',
    textAlign: 'right',
  },
};

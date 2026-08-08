import React from 'react';

export function TwinTable({ competencies }) {
  const getMasteryBadge = (mastery) => {
    switch (mastery) {
      case 'proficient':
        return <span className="badge success">🌟 Proficient</span>;
      case 'developing':
        return <span className="badge primary">📈 Developing</span>;
      case 'emerging':
        return <span className="badge warning">🌱 Emerging</span>;
      default:
        return <span className="badge muted">⚪ Not Started</span>;
    }
  };

  if (!competencies || competencies.length === 0) {
    return (
      <div className="empty-state">
        <span className="icon">📊</span>
        <h3>No Competency Data</h3>
        <p>No competency state records available for this learner yet.</p>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thRow}>
            <th style={styles.th}>Topic / Competency</th>
            <th style={styles.th}>Mastery Level</th>
            <th style={styles.th}>Last Practiced</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {competencies.map((comp) => (
            <tr key={comp.id} style={styles.tr}>
              <td style={{ ...styles.td, fontWeight: '600', color: 'var(--text-primary)' }}>
                {comp.name}
              </td>
              <td style={styles.td}>{getMasteryBadge(comp.mastery)}</td>
              <td style={{ ...styles.td, color: 'var(--text-muted)' }}>
                {comp.last_practiced ? comp.last_practiced : 'Never'}
              </td>
              <td style={styles.td}>
                {comp.review_due ? (
                  <span className="badge warning">🔄 Review Due</span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: 'var(--surface-elevated)',
    borderBottom: '1px solid var(--border)',
  },
  th: {
    padding: '12px 18px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'background-color 0.12s ease',
  },
  td: {
    padding: '12px 18px',
    color: 'var(--text-secondary)',
  },
};

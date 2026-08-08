import React from 'react';

export function GlanceCard({ glance }) {
  if (!glance) return null;

  const hours = Math.floor(glance.total_learning_time_min / 60);
  const mins = glance.total_learning_time_min % 60;
  const timeStr = `${hours}h ${mins}m`;

  return (
    <div className="card fade-in" style={styles.card}>
      <h3 style={styles.title}>
        <span>📅</span> This Week at a Glance
      </h3>

      <div style={styles.grid}>
        <div style={styles.item}>
          <span style={styles.icon}>🎯</span>
          <div>
            <span style={styles.value}>
              {glance.sessions_attended} <span style={styles.sub}>of {glance.sessions_planned} planned</span>
            </span>
            <span style={styles.label}>Sessions Attended</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>⏱️</span>
          <div>
            <span style={styles.value}>{timeStr}</span>
            <span style={styles.label}>Total Learning Time</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>📚</span>
          <div>
            <span style={styles.value}>{glance.topics_covered?.length || 0} Topics</span>
            <span style={styles.label}>{glance.topics_covered?.join(', ')}</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>✅</span>
          <div>
            <span style={styles.value}>
              {glance.tasks_completed} <span style={styles.sub}>of {glance.tasks_total}</span>
            </span>
            <span style={styles.label}>Tasks Completed</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>🤝</span>
          <div>
            <span style={styles.value}>{glance.mentor_check_ins}</span>
            <span style={styles.label}>Mentor Check-ins</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
  },
  icon: {
    fontSize: '22px',
  },
  value: {
    fontSize: '15px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    display: 'block',
  },
  sub: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-muted)',
  },
  label: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '1px',
    display: 'block',
  },
};

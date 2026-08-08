import React, { useState } from 'react';

export function EventLog({ events }) {
  const [filter, setFilter] = useState('all');

  const getEventBadgeClass = (color) => {
    switch (color) {
      case 'green':
      case 'success':
        return 'success';
      case 'red':
      case 'danger':
        return 'danger';
      case 'orange':
      case 'warning':
        return 'warning';
      case 'purple':
        return 'purple';
      case 'blue':
      case 'info':
      default:
        return 'info';
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filter === 'checks') return ev.type.includes('check');
    if (filter === 'ai') return ev.type.includes('ai');
    if (filter === 'tasks') return ev.type.includes('task');
    return true;
  });

  return (
    <div className="card fade-in">
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📜</span>
          <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Session Events Timeline</h3>
        </div>

        <div style={styles.filters}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('all')}
          >
            All ({events.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'tasks' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('tasks')}
          >
            Tasks
          </button>
          <button
            className={`btn btn-sm ${filter === 'checks' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('checks')}
          >
            Checks
          </button>
          <button
            className={`btn btn-sm ${filter === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter('ai')}
          >
            AI Queries
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
          No events matching filter.
        </p>
      ) : (
        <div style={styles.timeline}>
          {filteredEvents.map((ev) => (
            <div key={ev.id} style={styles.timelineItem}>
              <span style={styles.timeStr}>{ev.time}</span>
              <div style={styles.dotContainer}>
                <span className={`badge ${getEventBadgeClass(ev.color)}`} style={{ borderRadius: '50%', padding: '4px', width: '8px', height: '8px' }} />
                <div style={styles.line} />
              </div>
              <div style={styles.eventContent}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {ev.label}
                </span>
              </div>
            </div>
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
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '14px',
  },
  filters: {
    display: 'flex',
    gap: '6px',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timeStr: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    width: '65px',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  dotContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    width: '1px',
    height: '16px',
    backgroundColor: 'var(--border)',
    marginTop: '4px',
  },
  eventContent: {
    flex: 1,
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '8px 12px',
  },
};

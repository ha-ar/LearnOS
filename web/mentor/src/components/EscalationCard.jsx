import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EscalationCard({ escalation, onAttend, onResolve, onDismiss }) {
  const navigate = useNavigate();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Just now';
    const mins = Math.floor((new Date() - new Date(isoString)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} min ago`;
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;
    setIsSubmitting(true);
    try {
      await onResolve(escalation.id, 'resolved', resolutionNote);
      setShowResolveModal(false);
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAttending = escalation.status === 'attending';

  return (
    <div className="card fade-in" style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <span style={styles.icon}>⚠️</span>
          <div>
            <div style={styles.learnerRow}>
              <h3 style={styles.learnerName}>{escalation.learner_name}</h3>
              <span className="badge muted">{escalation.learner_grade || 'Grade 6'}</span>
            </div>
            <span style={styles.competencyText}>Topic: <strong>{escalation.competency}</strong></span>
          </div>
        </div>

        <div style={styles.metaRight}>
          <span style={styles.timeAgo}>{formatTimeAgo(escalation.created_at)}</span>
          {isAttending ? (
            <span className="badge warning">🙋 Mentor Attending</span>
          ) : (
            <span className="badge danger">Pending Review</span>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.briefBox}>
          <div style={styles.sectionHeader}>
            <span>📋</span> AI DIAGNOSIS BRIEF
          </div>
          <p style={styles.briefText}>{escalation.brief_text}</p>
        </div>
      </div>

      {escalation.evidence_snapshot && (
        <div style={styles.evidenceGrid}>
          <div style={styles.evidenceCard}>
            <span style={styles.evidenceVal}>
              ❌ {escalation.evidence_snapshot.incorrect_answers || 0}
            </span>
            <span style={styles.evidenceLabel}>Incorrect Answers</span>
          </div>

          <div style={styles.evidenceCard}>
            <span style={styles.evidenceVal}>
              💡 {escalation.evidence_snapshot.hints_requested || 0}
            </span>
            <span style={styles.evidenceLabel}>Hints Requested</span>
          </div>

          <div style={styles.evidenceCard}>
            <span style={styles.evidenceVal}>
              ⏳ {escalation.evidence_snapshot.time_stuck_min || 0}m
            </span>
            <span style={styles.evidenceLabel}>Time Stuck</span>
          </div>
        </div>
      )}

      {escalation.ai_suggested_approach && (
        <div style={styles.approachBox}>
          <div style={styles.sectionHeaderPurple}>
            <span>💡</span> SUGGESTED MENTOR APPROACH
          </div>
          <p style={styles.approachText}>"{escalation.ai_suggested_approach}"</p>
        </div>
      )}

      <div style={styles.actionsRow}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/learners/${escalation.learner_id}`)}
        >
          Go to Learner →
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isAttending ? (
            <button
              className="btn btn-warning btn-sm"
              onClick={() => onAttend(escalation.id)}
            >
              Mark Attending ✓
            </button>
          ) : (
            <button
              className="btn btn-success btn-sm"
              onClick={() => setShowResolveModal(true)}
            >
              Resolve Intervention ✓
            </button>
          )}

          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)' }}
            onClick={() => onDismiss(escalation.id)}
          >
            Dismiss ✗
          </button>
        </div>
      </div>

      {/* Resolve Modal Form */}
      {showResolveModal && (
        <div style={styles.modalBackdrop}>
          <div className="card fade-in" style={styles.modalCard}>
            <h3 style={{ marginBottom: '12px' }}>Resolve Escalation for {escalation.learner_name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Document your intervention summary. This note will be recorded in the Digital Twin.
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <label className="label">Intervention Notes</label>
                <textarea
                  className="textarea"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Explained numerator multiplying with physical fraction blocks. Sara understood after 5 minutes."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowResolveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-sm"
                  disabled={isSubmitting || !resolutionNote.trim()}
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    borderLeft: '4px solid var(--danger)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: 'var(--surface)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: '24px',
  },
  learnerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  learnerName: {
    fontSize: '17px',
    fontWeight: '800',
  },
  competencyText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
    display: 'block',
  },
  metaRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  timeAgo: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    color: 'var(--danger)',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  briefBox: {
    backgroundColor: 'var(--danger-dim)',
    border: '1px solid rgba(239,68,68,0.2)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
  },
  briefText: {
    fontSize: '13px',
    color: 'var(--text-primary)',
    lineHeight: '1.45',
  },
  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  evidenceCard: {
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  evidenceVal: {
    fontSize: '15px',
    fontWeight: '700',
  },
  evidenceLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  approachBox: {
    backgroundColor: 'var(--purple-dim)',
    border: '1px solid rgba(168,85,247,0.25)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
  },
  sectionHeaderPurple: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    color: 'var(--purple)',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  approachText: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: 'var(--text-primary)',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border)',
    paddingTop: '14px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalCard: {
    width: '90%',
    maxWidth: '480px',
    backgroundColor: 'var(--surface-elevated)',
  },
};

import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { GlanceCard } from '../components/GlanceCard';
import { PlainSummary } from '../components/PlainSummary';
import { TopicProgressList } from '../components/TopicProgressList';
import { ConfidenceWidget } from '../components/ConfidenceWidget';
import { NextWeekCard } from '../components/NextWeekCard';
import { HomeQuestionCard } from '../components/HomeQuestionCard';
import { MentorNoteCard } from '../components/MentorNoteCard';
import { EmailPreviewModal } from '../components/EmailPreviewModal';

export function LatestReportPage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState('');

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getLatestReport();
      setReport(res.report || res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.sendEmail(report.week_label);
      setEmailNotice(`Email report sent to ${res.recipient || 'parent@pilot.learnos'}`);
      setTimeout(() => setEmailNotice(''), 4000);
    } catch (err) {
      console.error('Send email failed:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-content">
        <div className="card" style={{ color: 'var(--warning)', padding: '24px' }}>
          Failed to load weekly report: {error?.message || 'Report data unavailable'}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Top Banner / Actions Bar */}
      <div style={styles.actionHeader}>
        <div>
          <span className="badge success" style={{ marginBottom: '6px' }}>
            WEEKLY REPORT • {report.week_label || '2026-W30'}
          </span>
          <h1 style={styles.reportTitle}>Weekly Progress Report</h1>
          <p style={styles.reportSub}>
            Week of {report.week_start} to {report.week_end} • {report.centre_name || 'LearnOS Learning Centre'}
          </p>
        </div>

        <div style={styles.btnGroup}>
          <button className="btn btn-ghost btn-sm" onClick={handlePrint}>
            🖨️ Print / Download PDF
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEmailModal(true)}>
            📧 Email Preview
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSendEmail} disabled={sendingEmail}>
            {sendingEmail ? 'Sending...' : 'Send to Email ✉️'}
          </button>
        </div>
      </div>

      {emailNotice && (
        <div className="badge success fade-in" style={{ padding: '10px 16px', width: '100%', marginBottom: '20px' }}>
          ✅ {emailNotice}
        </div>
      )}

      {/* Main Report Body Sections */}
      <div style={styles.sectionsContainer}>
        {/* Section 2: This Week at a Glance */}
        <GlanceCard glance={report.glance} />

        {/* Section 3: Plain Language Narrative Summary */}
        <PlainSummary learnerName={report.learner_name} summaryText={report.summary_text} />

        {/* Section 4: Progress by Topic */}
        <TopicProgressList topics={report.topics} />

        {/* Grid for Confidence & Next Week */}
        <div style={styles.twoColumnGrid}>
          {/* Section 6: Child Confidence */}
          <ConfidenceWidget confidence={report.confidence_summary} />

          {/* Section 5: Next Week Topics */}
          <NextWeekCard topics={report.next_week_topics} />
        </div>

        {/* Grid for Mentor Note & Home Question */}
        <div style={styles.twoColumnGrid}>
          {/* Section 7: Mentor Note */}
          <MentorNoteCard note={report.mentor_note} />

          {/* Section 8: Question to Ask at Home */}
          <HomeQuestionCard question={report.question_for_home} />
        </div>

        {/* Report Footer */}
        <div className="card" style={styles.footerCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Have questions about {report.learner_name?.split(' ')[0]}'s progress?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Contact your LearnOS learning centre team at support@learnos.com
              </p>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Generated {new Date(report.generated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* HTML Email Preview Modal */}
      {showEmailModal && (
        <EmailPreviewModal report={report} onClose={() => setShowEmailModal(false)} />
      )}
    </div>
  );
}

const styles = {
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '20px',
  },
  reportTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  reportSub: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  btnGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  footerCard: {
    backgroundColor: 'var(--surface-elevated)',
    marginTop: '12px',
  },
};

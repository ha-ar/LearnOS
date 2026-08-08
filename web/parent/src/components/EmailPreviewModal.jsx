import React from 'react';

export function EmailPreviewModal({ report, onClose }) {
  if (!report) return null;

  const topicsRows = report.topics
    ?.map(
      (t) => `
    <tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b;">${t.topic}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; width: 35%;">
        <div style="background-color: #e2e8f0; border-radius: 9999px; height: 10px; width: 100%; overflow: hidden;">
          <div style="background-color: #3b82f6; height: 100%; width: ${t.mastery_percent}%;"></div>
        </div>
      </td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">${t.mastery_label} (${t.mastery_percent}%)</td>
    </tr>`
    )
    .join('') || '';

  const nextTopics = report.next_week_topics?.map((nt) => `<li>${nt}</li>`).join('') || '';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 16px; color: #1e293b; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: #1e3a8a; color: #ffffff; padding: 24px 20px; text-align: center; }
    .body { padding: 20px; }
    .glance-box { background: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
    .section-header { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-bottom: 12px; }
    .alert-box { border-left: 4px solid; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; }
    .footer { background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="margin:0; font-size:20px;">LearnOS Parent Weekly Report</h1>
      <p style="margin:6px 0 0 0; font-size:13px; opacity:0.9;">${report.learner_name} • Week of ${report.week_start} to ${report.week_end}</p>
    </div>

    <div class="body">
      <div class="glance-box">
        <h3 style="margin-top:0; font-size:14px; color:#0f172a;">📅 This Week at a Glance</h3>
        <p style="margin:4px 0; font-size:13px;"><strong>Sessions:</strong> ${report.glance?.sessions_attended} of ${report.glance?.sessions_planned} attended</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Time:</strong> ${Math.floor((report.glance?.total_learning_time_min || 200) / 60)}h ${(report.glance?.total_learning_time_min || 200) % 60}m</p>
        <p style="margin:4px 0; font-size:13px;"><strong>Tasks Completed:</strong> ${report.glance?.tasks_completed} of ${report.glance?.tasks_total}</p>
      </div>

      <div style="margin-bottom:20px;">
        <div class="section-header">📖 What ${report.learner_name?.split(' ')[0]} Learned</div>
        <p style="font-size:14px; line-height:1.5;">${report.summary_text}</p>
      </div>

      <div style="margin-bottom:20px;">
        <div class="section-header">📊 Progress by Topic</div>
        <table style="width:100%; border-collapse:collapse;">
          <tbody>${topicsRows}</tbody>
        </table>
      </div>

      <div class="alert-box" style="background-color:#eff6ff; border-color:#3b82f6;">
        <strong style="color:#1e40af;">💙 Child Confidence:</strong> ${report.confidence_summary?.text}
      </div>

      <div style="margin-bottom:20px;">
        <div class="section-header">🚀 Next Week Topics</div>
        <ul style="margin:6px 0; padding-left:18px; font-size:13px;">${nextTopics}</ul>
      </div>

      ${
        report.mentor_note
          ? `<div class="alert-box" style="background-color:#fefce8; border-color:#eab308;">
              <strong style="color:#854d0e;">💬 Mentor Note:</strong> "${report.mentor_note}"
            </div>`
          : ''
      }

      <div class="alert-box" style="background-color:#f0fdf4; border-color:#22c55e;">
        <strong style="color:#166534;">💡 Question to Ask at Home:</strong> ${report.question_for_home}
      </div>
    </div>

    <div class="footer">
      LearnOS © 2026 • Sent to parent@pilot.learnos
    </div>
  </div>
</body>
</html>`;

  return (
    <div style={styles.backdrop}>
      <div className="card fade-in" style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>📬 Email Preview (HTML)</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Recipient: parent@pilot.learnos
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        <div style={styles.iframeContainer}>
          <iframe
            srcDoc={htmlContent}
            title="Email Report Preview"
            style={styles.iframe}
          />
        </div>

        <div style={styles.modalFooter}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '720px',
    height: '85vh',
    maxHeight: '820px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '14px',
    flexShrink: 0,
  },
  iframeContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    backgroundColor: '#f8fafc',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
};

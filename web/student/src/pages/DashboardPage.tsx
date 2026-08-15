import { useEffect, useState } from 'react';
import { Api } from '../api';
import { LearningPlan, Recommendation } from '../types';

interface Props {
  name: string;
  onLogout: () => void;
}

const MASTERY_META: Record<string, { label: string; className: string }> = {
  mastered: { label: 'Mastered', className: 'm-mastered' },
  proficient: { label: 'Proficient', className: 'm-proficient' },
  developing: { label: 'Developing', className: 'm-developing' },
  emerging: { label: 'Emerging', className: 'm-emerging' },
  needs_review: { label: 'Needs review', className: 'm-emerging' },
  not_started: { label: 'Not started', className: 'm-notstarted' },
};

function masteryMeta(level: string) {
  return MASTERY_META[level] || MASTERY_META.not_started;
}

export function DashboardPage({ name, onLogout }: Props) {
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([Api.getPlan(), Api.getNext()])
      .then(([p, n]) => {
        setPlan(p);
        setRec(n.recommendation);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p className="subtitle">Loading your learning plan…</p></div>;
  if (error) return <div className="card"><div className="error">{error}</div></div>;

  const progress = rec?.plan_progress;
  const pct = progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="card">
        <div className="dash-header">
          <div>
            <div className="step-badge">Step 3 of 3 · Your Digital Twin</div>
            <h1>Hi {name.split(' ')[0]}, your plan is ready 🎯</h1>
          </div>
          <button className="btn ghost small" onClick={onLogout}>Log out</button>
        </div>

        <div className="progress-row big">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="progress-label">{progress?.completed ?? 0}/{progress?.total ?? 0} mastered</span>
        </div>
      </div>

      {/* Next recommendation */}
      <div className="card highlight">
        <div className="eyebrow">Recommended next</div>
        {rec?.complete ? (
          <>
            <h2 className="q-text">You've mastered your whole plan! 🏆</h2>
            <p className="subtitle">{rec.message}</p>
          </>
        ) : rec?.next_competency ? (
          <>
            <h2 className="q-text">{rec.next_competency.topic}</h2>
            <p className="subtitle">{rec.reason}</p>
            {rec.recommended_resource && (
              <div className="resource-pill">
                <span className="res-format">{rec.recommended_resource.format}</span>
                <span>{rec.recommended_resource.title}</span>
                {rec.recommended_resource.duration_min != null && (
                  <span className="res-dur">{rec.recommended_resource.duration_min} min</span>
                )}
              </div>
            )}
            <button className="btn primary" disabled title="Session workspace is the learner client">
              Start lesson →
            </button>
          </>
        ) : (
          <p className="subtitle">{rec?.message || 'No recommendation yet.'}</p>
        )}
      </div>

      {/* Learning plan ladder */}
      <div className="card">
        <div className="eyebrow">Your personalised learning plan</div>
        <ul className="plan-list">
          {plan?.items.map((item) => {
            const meta = masteryMeta(item.mastery_level);
            const isNext = rec?.next_competency?.competency_id === item.competency_id;
            return (
              <li key={item.competency_id} className={`plan-item ${isNext ? 'is-next' : ''}`}>
                <span className="seq">{item.sequence_order}</span>
                <div className="plan-main">
                  <span className="plan-topic">{item.topic}</span>
                  <span className="plan-grade">{item.grade_level}</span>
                </div>
                {isNext && <span className="next-tag">Next</span>}
                <span className={`mastery ${meta.className}`}>{meta.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

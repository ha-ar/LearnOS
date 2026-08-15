import { useEffect, useState } from 'react';
import { Api } from '../api';
import { PlacementQuestion, Preferences } from '../types';

interface Props {
  grade: string;
  preferences: Preferences;
  onComplete: () => void;
}

export function PlacementTestPage({ grade, preferences, onComplete }: Props) {
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Api.getPlacementTest()
      .then((t) => setQuestions(t.questions))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><p className="subtitle">Loading your placement check…</p></div>;
  if (error) return <div className="card"><div className="error">{error}</div></div>;
  if (questions.length === 0) return <div className="card"><p>No placement questions available.</p></div>;

  const q = questions[idx];
  const selected = answers[q.id];
  const answeredCount = Object.keys(answers).length;
  const isLast = idx === questions.length - 1;

  function choose(key: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: key }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await Api.submitPlacement({
        grade,
        subject: 'Mathematics',
        preferences,
        answers: Object.entries(answers).map(([question_id, selected]) => ({ question_id, selected })),
      });
      onComplete();
    } catch (e: any) {
      setError(e.message || 'Could not submit your answers');
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="step-badge">Step 2 of 3 · Placement check</div>
      <div className="progress-row">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
        <span className="progress-label">{answeredCount}/{questions.length}</span>
      </div>

      <div className="q-topic">{q.topic} · {q.difficulty}</div>
      <h2 className="q-text">{q.question_text}</h2>

      <div className="options">
        {q.options.map((opt) => (
          <button
            key={opt.key}
            className={`option ${selected === opt.key ? 'selected' : ''}`}
            onClick={() => choose(opt.key)}
            type="button"
          >
            <span className="opt-key">{opt.key.toUpperCase()}</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="nav-row">
        <button className="btn ghost" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} type="button">
          ← Back
        </button>
        {!isLast ? (
          <button className="btn primary" onClick={() => setIdx((i) => i + 1)} disabled={!selected} type="button">
            Next →
          </button>
        ) : (
          <button className="btn primary" onClick={submit} disabled={answeredCount < questions.length || submitting} type="button">
            {submitting ? 'Building your plan…' : 'Finish & build my plan'}
          </button>
        )}
      </div>
      {isLast && answeredCount < questions.length && (
        <p className="hint">Answer all {questions.length} questions to finish. You can go back to any you skipped.</p>
      )}
    </div>
  );
}

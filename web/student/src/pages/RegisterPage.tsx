import { useState } from 'react';
import { Api, setToken } from '../api';
import { Preferences } from '../types';

interface Props {
  onRegistered: (info: { name: string; grade: string; preferences: Preferences }) => void;
}

const GRADES = ['Grade 5', 'Grade 6', 'Grade 7'];
const FORMATS = [
  { key: 'video', label: 'Watching videos' },
  { key: 'article', label: 'Reading' },
  { key: 'interactive', label: 'Interactive practice' },
  { key: 'mixed', label: 'A mix of everything' },
];

export function RegisterPage({ onRegistered }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('Grade 6');
  const [preferredFormat, setPreferredFormat] = useState('mixed');
  const [sessionLength, setSessionLength] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await Api.register({ name, email, password, grade });
      setToken(result.access_token);
      onRegistered({
        name: result.user?.name || name,
        grade,
        preferences: { preferred_format: preferredFormat, preferred_session_length_min: sessionLength },
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="step-badge">Step 1 of 3</div>
      <h1>Welcome to LearnOS 👋</h1>
      <p className="subtitle">
        Let's set up your learning profile. We'll ask a few questions, then a short
        placement check so your Digital Twin can build a plan made just for you.
      </p>

      <form onSubmit={submit}>
        <label className="field">
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha Khan" />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" />
        </label>

        <label className="field">
          <span>Your grade</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>How do you like to learn best?</span>
          <select value={preferredFormat} onChange={(e) => setPreferredFormat(e.target.value)}>
            {FORMATS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Preferred session length: <strong>{sessionLength} min</strong></span>
          <input
            type="range"
            min={15}
            max={60}
            step={5}
            value={sessionLength}
            onChange={(e) => setSessionLength(Number(e.target.value))}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn primary" disabled={loading}>
          {loading ? 'Creating your profile…' : 'Continue to placement check →'}
        </button>
      </form>
    </div>
  );
}

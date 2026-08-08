import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('mentor@pilot.learnos');
  const [password, setPassword] = useState('LearnOS2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="card fade-in" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <span style={{ fontSize: '32px' }}>🎓</span>
          </div>
          <h1 style={styles.title}>LearnOS Mentor Portal</h1>
          <p style={styles.subtitle}>Coach & Human-in-the-Loop Operations</p>
        </div>

        {error && (
          <div className="badge danger" style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Mentor Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In as Mentor →'}
          </button>
        </form>

        <div style={styles.footerNote}>
          <span>Demo Account: mentor@pilot.learnos / LearnOS2026!</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--surface)',
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
    marginBottom: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    marginBottom: '18px',
    width: '100%',
    justifyContent: 'center',
    fontSize: '12px',
  },
  footerNote: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)',
    paddingTop: '14px',
  },
};

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@pilot.learnos');
  const [password, setPassword] = useState('LearnOS2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <ShieldCheck size={32} color="#0ea5e9" />
          </div>
          <h1 style={styles.title}>LearnOS Admin Panel</h1>
          <p style={styles.subtitle}>Centre Operations & Configuration</p>
        </div>

        {error && (
          <div className="badge badge-warning" style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              className="form-input"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              className="form-input"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footerNote}>Demo Admin: admin@pilot.learnos / LearnOS2026!</div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoBadge: {
    marginBottom: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  errorBox: {
    display: 'block',
    padding: '10px 14px',
    marginBottom: '16px',
    fontSize: '12px',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
  },
  submitBtn: {
    width: '100%',
    marginTop: '4px',
    padding: '12px',
    fontSize: '14px',
  },
  footerNote: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '14px',
  },
};

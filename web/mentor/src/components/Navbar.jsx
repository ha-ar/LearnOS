import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePolling } from '../hooks/usePolling';
import { api } from '../api/client';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Poll escalations for global badge count
  const { data: escData } = usePolling(api.getEscalations, 15000);
  const pendingCount = escData?.escalations?.filter(e => e.status === 'pending').length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.brandGroup}>
        <div style={styles.logoBadge}>
          <span style={{ fontSize: '18px' }}>🎓</span>
          <span style={styles.brandTitle}>LearnOS</span>
        </div>
        <span style={styles.portalTag}>MENTOR PORTAL</span>
      </div>

      <nav style={styles.navLinks}>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>📊</span> Overview
        </NavLink>

        <NavLink
          to="/escalations"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>⚠️</span> Escalations
          {pendingCount > 0 && (
            <span className="badge danger" style={styles.escBadge}>
              {pendingCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/summary"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>📈</span> Weekly Summary
        </NavLink>
      </nav>

      <div style={styles.userGroup}>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.name || 'Ms. Nadia'}</span>
          <span style={styles.userRole}>Lead Coach</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Log Out">
          🚪 Logout
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 'var(--navbar-h)',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  portalTag: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-dim)',
    border: '1px solid var(--primary-border)',
    padding: '2px 7px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
  },
  activeLink: {
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--primary)',
  },
  escBadge: {
    marginLeft: '2px',
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  userGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
};

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.brandGroup}>
        <div style={styles.logoBadge}>
          <span style={{ fontSize: '20px' }}>👨‍👩‍👧</span>
          <span style={styles.brandTitle}>LearnOS</span>
        </div>
        <span style={styles.portalTag}>PARENT PORTAL</span>
      </div>

      <div style={styles.childBadge}>
        <span style={{ fontSize: '14px' }}>🎓</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {user?.child_name || 'Ahmed Khan'}
        </span>
        <span className="badge primary" style={{ fontSize: '10px', padding: '1px 6px' }}>
          {user?.child_grade || 'Grade 6'}
        </span>
      </div>

      <nav style={styles.navLinks}>
        <NavLink
          to="/report/latest"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>📄</span> Latest Report
        </NavLink>

        <NavLink
          to="/history"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>📜</span> Report Archive
        </NavLink>

        <NavLink
          to="/overview"
          style={({ isActive }) => (isActive ? { ...styles.link, ...styles.activeLink } : styles.link)}
        >
          <span>📊</span> Progress Overview
        </NavLink>
      </nav>

      <div style={styles.userGroup}>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.name || 'Tariq Khan'}</span>
          <span style={styles.userRole}>Parent / Guardian</span>
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
    color: 'var(--success)',
    backgroundColor: 'var(--success-dim)',
    border: '1px solid rgba(34,197,94,0.3)',
    padding: '2px 7px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  childBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
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
  userGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
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

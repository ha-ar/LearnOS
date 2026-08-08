import React, { useState } from 'react';
import { LayoutDashboard, Users, Cpu, BookOpen, ShieldCheck, FileText } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { UserManagementView } from './components/UserManagementView';
import { DeviceManagementView } from './components/DeviceManagementView';
import { CurriculumConfigView } from './components/CurriculumConfigView';
import { ConsentManagementView } from './components/ConsentManagementView';
import { AuditLogView } from './components/AuditLogView';

type NavTab = 'dashboard' | 'users' | 'devices' | 'curriculum' | 'consent' | 'audit';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="nav-logo-badge">L</div>
          <div className="nav-title-group">
            <h1>LearnOS Admin Panel</h1>
            <p>Centre Operations & Configuration</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Users
          </button>
          <button
            className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            <Cpu size={16} /> Devices
          </button>
          <button
            className={`tab-button ${activeTab === 'curriculum' ? 'active' : ''}`}
            onClick={() => setActiveTab('curriculum')}
          >
            <BookOpen size={16} /> Curriculum
          </button>
          <button
            className={`tab-button ${activeTab === 'consent' ? 'active' : ''}`}
            onClick={() => setActiveTab('consent')}
          >
            <ShieldCheck size={16} /> Consent
          </button>
          <button
            className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={16} /> Audit Log
          </button>
        </nav>

        <div className="nav-user">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Centre Admin</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>admin@learnos.pk</div>
          </div>
          <span className="role-badge">ADMIN</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'users' && <UserManagementView />}
        {activeTab === 'devices' && <DeviceManagementView />}
        {activeTab === 'curriculum' && <CurriculumConfigView />}
        {activeTab === 'consent' && <ConsentManagementView />}
        {activeTab === 'audit' && <AuditLogView />}
      </main>
    </div>
  );
};

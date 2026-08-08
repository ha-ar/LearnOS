import React, { useEffect, useState } from 'react';
import { Users, Calendar, AlertTriangle, Cpu, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { DashboardStats, AtRiskLearner } from '../types';
import { AdminApi } from '../api';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskLearner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [sData, rData] = await Promise.all([
        AdminApi.getDashboardStats(),
        AdminApi.getAtRiskLearners(),
      ]);
      setStats(sData);
      setAtRisk(rData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading Centre Overview Dashboard...
      </div>
    );
  }

  const sessionPct = Math.round((stats.sessions_completed / (stats.sessions_this_week || 1)) * 100);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
          Centre Overview Dashboard
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          LearnOS Pilot Centre — Operations & Health Summary for week of July 21, 2026
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <p>Active Learners</p>
            <div className="stat-number">{stats.active_learners} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {stats.total_learners} total</span></div>
            <div className="stat-subtext">80% attendance today</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Weekly Sessions</p>
            <div className="stat-number">{stats.sessions_completed} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {stats.sessions_this_week}</span></div>
            <div className="stat-subtext">{sessionPct}% completion rate</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Open Escalations</p>
            <div className="stat-number" style={{ color: stats.open_escalations > 0 ? '#f43f5e' : '#10b981' }}>
              {stats.open_escalations}
            </div>
            <div className="stat-subtext" style={{ color: '#94a3b8' }}>
              {stats.resolved_escalations} resolved this week
            </div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <p>Avg. Topic Mastery</p>
            <div className="stat-number">{stats.avg_mastery_pct}%</div>
            <div className="stat-subtext">Fractions & Decimals</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Devices Banner & Session Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} style={{ color: '#6366f1' }} />
              Session Attendance & Completion Pace
            </div>
            <span className="badge badge-success">48 Sessions Logged</span>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Planned vs. Completed Sessions (Week of July 21)</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{sessionPct}% On Track</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${sessionPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} style={{ color: '#38bdf8' }} />
              Centre Kiosk Devices
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {stats.devices_online} / {stats.devices_total}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Kiosk Devices Online</p>
            </div>
            <span className="badge badge-success">
              <CheckCircle size={12} /> All Rooms Connected
            </span>
          </div>
        </div>
      </div>

      {/* At Risk Learners Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            Learners Needing Attention (At-Risk Detection)
          </div>
          <span className="badge badge-warning">{atRisk.length} Action Needed</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Learner Name</th>
                <th>Grade</th>
                <th>Sessions Completed</th>
                <th>Mastery</th>
                <th>Open Escalations</th>
                <th>Risk Factor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {atRisk.map((item) => (
                <tr key={item.learner_id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.grade}</td>
                  <td>{item.sessions_completed} / {item.sessions_total}</td>
                  <td>
                    <span style={{ color: item.avg_mastery_pct < 40 ? '#f43f5e' : '#f59e0b', fontWeight: 700 }}>
                      {item.avg_mastery_pct}%
                    </span>
                  </td>
                  <td>
                    {item.open_escalations > 0 ? (
                      <span className="badge badge-danger">{item.open_escalations} Open</span>
                    ) : (
                      <span className="badge badge-neutral">0</span>
                    )}
                  </td>
                  <td style={{ color: '#f59e0b', fontWeight: 600 }}>{item.risk_reason}</td>
                  <td>
                    <span className="badge badge-warning">Needs Review</span>
                  </td>
                </tr>
              ))}
              {atRisk.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    No at-risk learners detected at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

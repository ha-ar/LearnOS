import React, { useEffect, useState } from 'react';
import { FileText, Download, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { AuditLogItem } from '../types';
import { AdminApi } from '../api';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const data = await AdminApi.getAuditLogs();
    setLogs(data);
    setLoading(false);
  }

  async function handleExportCsv() {
    const csvContent = await AdminApi.exportAuditLogCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `learnos_audit_log_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.payload_summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResult = filterResult === 'all' || log.result === filterResult;
    return matchesQuery && matchesResult;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            System Audit Log (Immutable)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Auditable, tamper-evident log of all administrative, safety, and data operations across the centre
          </p>
        </div>
        <button className="btn-primary" onClick={handleExportCsv}>
          <Download size={16} /> Export Audit CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
        >
          <option value="all">All Results</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action Code</th>
                <th>Resource Type</th>
                <th>Result</th>
                <th>Summary Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading audit log...
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.actor_name || 'System'}</div>
                      <span className="role-badge" style={{ fontSize: '0.65rem' }}>
                        {log.actor_role || 'system'}
                      </span>
                    </td>
                    <td>
                      <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#38bdf8', fontSize: '0.8rem' }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ textTransform: 'capitalize', color: '#94a3b8' }}>
                      {log.resource_type || '—'}
                    </td>
                    <td>
                      {log.result === 'success' ? (
                        <span className="badge badge-success"><CheckCircle size={12} /> Success</span>
                      ) : (
                        <span className="badge badge-danger"><AlertTriangle size={12} /> {log.result}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {log.payload_summary || '—'}
                    </td>
                  </tr>
                ))
              )}
              {filteredLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    No audit records match the current filter.
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

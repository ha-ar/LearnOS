import React, { useEffect, useState } from 'react';
import { Cpu, PlusCircle, CheckCircle, XCircle, Key, Copy } from 'lucide-react';
import { Device } from '../types';
import { AdminApi } from '../api';

export const DeviceManagementView: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form
  const [deviceName, setDeviceName] = useState('');
  const [room, setRoom] = useState('Room 1');
  const [platform, setPlatform] = useState('windows');
  const [osVersion, setOsVersion] = useState('Windows 11 Pro Kiosk');
  const [generatedDevice, setGeneratedDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    setLoading(true);
    const data = await AdminApi.getDevices();
    setDevices(data);
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceName) return;
    const newDev = await AdminApi.registerDevice({ name: deviceName, room, platform, os_version: osVersion });
    setGeneratedDevice(newDev);
    setDeviceName('');
    loadDevices();
  }

  async function handleToggleStatus(deviceId: string, currentStatus: boolean) {
    await AdminApi.toggleDeviceStatus(deviceId, !currentStatus);
    loadDevices();
  }

  function copyToken(token: string, id: string) {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            Device & Kiosk Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Register physical learning centre devices and generate secure authentication tokens
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setGeneratedDevice(null); setShowRegisterModal(true); }}>
          <PlusCircle size={16} /> Register New Device
        </button>
      </div>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>Room</th>
                <th>Platform / OS</th>
                <th>Device Token (256-bit)</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Loading registered devices...
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Cpu size={16} style={{ color: '#38bdf8' }} />
                        {d.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {d.id}</div>
                    </td>
                    <td>{d.room || 'Unassigned'}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{d.platform}</span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.os_version || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ background: '#0f172a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#38bdf8' }}>
                          {d.device_token.substring(0, 16)}...
                        </code>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                          title="Copy 256-bit Token"
                          onClick={() => copyToken(d.device_token, d.id)}
                        >
                          <Copy size={12} /> {copiedId === d.id ? 'Copied' : ''}
                        </button>
                      </div>
                    </td>
                    <td>
                      {d.is_active ? (
                        <span className="badge badge-success"><CheckCircle size={12} /> Active</span>
                      ) : (
                        <span className="badge badge-neutral"><XCircle size={12} /> Inactive</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {d.last_seen_at ? new Date(d.last_seen_at).toLocaleTimeString() : 'Never'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStatus(d.id, d.is_active)}
                      >
                        {d.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Device Modal */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
              Register Centre Device & Issue Token
            </h3>

            {generatedDevice ? (
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <CheckCircle size={18} /> Device Token Generated Successfully!
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  Copy this 256-bit token into the client application configuration or installation package.
                </p>

                <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: 700 }}>X-Device-Token Header:</div>
                  <code style={{ fontSize: '0.8rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                    {generatedDevice.device_token}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    onClick={() => { copyToken(generatedDevice.device_token, 'gen'); }}
                  >
                    <Copy size={14} /> Copy Token
                  </button>
                  <button className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Device Identifier Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Room 1 PC - Station 3"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Physical Room / Location</label>
                  <select
                    className="form-select"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  >
                    <option value="Room 1">Room 1</option>
                    <option value="Room 2">Room 2</option>
                    <option value="Lab A">Lab A</option>
                    <option value="Library Kiosk">Library Kiosk</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Platform OS</label>
                  <select
                    className="form-select"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="windows">Windows Assigned Access</option>
                    <option value="macos">macOS Kiosk (ASAM)</option>
                    <option value="ios">iOS Single App Mode</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">OS Version String</label>
                  <input
                    type="text"
                    className="form-input"
                    value={osVersion}
                    onChange={(e) => setOsVersion(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <Key size={14} /> Register & Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

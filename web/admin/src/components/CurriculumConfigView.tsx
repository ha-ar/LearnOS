import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Save, Layers } from 'lucide-react';
import { Curriculum, TenantConfig } from '../types';
import { AdminApi } from '../api';

export const CurriculumConfigView: React.FC = () => {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  // Form selections
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('');
  const [activeSubjects, setActiveSubjects] = useState<string[]>(['Mathematics']);
  const [gradeMin, setGradeMin] = useState<number>(6);
  const [gradeMax, setGradeMax] = useState<number>(8);

  const availableSubjectList = ['Mathematics', 'Science', 'English', 'Urdu', 'Computer Science'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [cList, tConfig] = await Promise.all([
        AdminApi.getCurricula(),
        AdminApi.getTenantConfig(),
      ]);
      setCurricula(cList);
      setConfig(tConfig);
      setSelectedCurriculumId(tConfig.active_curriculum_id || cList[0]?.id || '');
      setActiveSubjects(tConfig.active_subjects || ['Mathematics']);
      setGradeMin(tConfig.grade_min || 6);
      setGradeMax(tConfig.grade_max || 8);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCurriculumId) return;
    const updated = await AdminApi.activateCurriculum(selectedCurriculumId, activeSubjects, gradeMin, gradeMax);
    setConfig(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  }

  function toggleSubject(subj: string) {
    if (activeSubjects.includes(subj)) {
      if (activeSubjects.length === 1) return; // Must keep at least one subject
      setActiveSubjects(activeSubjects.filter(s => s !== subj));
    } else {
      setActiveSubjects([...activeSubjects, subj]);
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading Curriculum Configuration...</div>;
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            Curriculum & Subject Configuration
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Set the active academic curriculum, subject catalogue, and target grade levels for this centre
          </p>
        </div>
      </div>

      {savedMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Check size={18} /> Tenant curriculum settings saved and activated across all kiosk devices!
        </div>
      )}

      <form onSubmit={handleSaveConfig}>
        {/* Curricula Selection Grid */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <BookOpen size={18} style={{ color: '#6366f1' }} />
              1. Select Active Curriculum Framework
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {curricula.map((curr) => {
              const isSelected = selectedCurriculumId === curr.id;
              return (
                <div
                  key={curr.id}
                  onClick={() => setSelectedCurriculumId(curr.id)}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#0f172a',
                    border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                      {curr.name}
                    </h4>
                    {isSelected && (
                      <span className="badge badge-success" style={{ background: '#6366f1', color: '#fff' }}>
                        Active
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{curr.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Code: {curr.code}</span> • <span>Region: {curr.country}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Subjects Selection */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} style={{ color: '#10b981' }} />
              2. Active Centre Subjects (MVP Focus)
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
            Select which subjects are enabled for session planning and resource discovery at this learning centre:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {availableSubjectList.map((subj) => {
              const active = activeSubjects.includes(subj);
              return (
                <button
                  type="button"
                  key={subj}
                  onClick={() => toggleSubject(subj)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: active ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                    color: active ? '#10b981' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {active && <Check size={14} />}
                  {subj} {subj === 'Mathematics' ? '(Primary MVP)' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade Range Configuration */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              3. Grade Level Range
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '500px' }}>
            <div className="form-group">
              <label className="form-label">Minimum Grade Level</label>
              <select
                className="form-select"
                value={gradeMin}
                onChange={(e) => setGradeMin(parseInt(e.target.value, 10))}
              >
                <option value={5}>Grade 5</option>
                <option value={6}>Grade 6</option>
                <option value={7}>Grade 7</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Grade Level</label>
              <select
                className="form-select"
                value={gradeMax}
                onChange={(e) => setGradeMax(parseInt(e.target.value, 10))}
              >
                <option value={7}>Grade 7</option>
                <option value={8}>Grade 8</option>
                <option value={9}>Grade 9</option>
                <option value={10}>Grade 10</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
            <Save size={18} /> Save & Activate Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

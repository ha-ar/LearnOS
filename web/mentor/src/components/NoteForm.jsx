import React, { useState } from 'react';

export function NoteForm({ learnerId, competencies, onAddNote }) {
  const [noteType, setNoteType] = useState('Observation');
  const [competency, setCompetency] = useState(competencies?.[0]?.name || 'General');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddNote({ note_type: noteType, competency, text });
      setText('');
    } catch (err) {
      console.error('Add note error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="card fade-in" onSubmit={handleSubmit} style={styles.card}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📝</span> Add Mentor Note
      </h3>

      <div style={styles.formGrid}>
        <div className="form-group">
          <label className="label">Note Type</label>
          <select
            className="select"
            value={noteType}
            onChange={(e) => setNoteType(e.target.value)}
          >
            <option value="Observation">Observation</option>
            <option value="Escalation">Escalation Intervention</option>
            <option value="Praise">Praise / Encouragement</option>
            <option value="Concern">Concern / Flag</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Linked Competency</label>
          <select
            className="select"
            value={competency}
            onChange={(e) => setCompetency(e.target.value)}
          >
            <option value="General">General / Overall</option>
            {competencies?.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label">Note Content</label>
        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter observation notes for learner twin history..."
          required
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? 'Saving Note...' : 'Save Note to Twin ✓'}
        </button>
      </div>
    </form>
  );
}

const styles = {
  card: {
    backgroundColor: 'var(--surface)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
};

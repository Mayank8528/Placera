import React, { useState } from 'react';
import api from '../services/api';

const ScheduleInterviewModal = ({ isOpen, onClose, applicant, jobId, jobTitle, onScheduled }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [mode, setMode] = useState('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!startTime || !endTime) {
      setError('Both start time and end time are required.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setError('End time must be after start time.');
      return;
    }

    if (start.getTime() < Date.now()) {
      setError('Cannot schedule an interview in the past.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/interviews', {
        applicationId: applicant._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        mode,
        meetingLink: mode === 'online' ? meetingLink.trim() : '',
        location: mode === 'in-person' ? location.trim() : '',
        instructions: instructions.trim(),
      });

      if (onScheduled) {
        onScheduled(res.data.interview);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Schedule Interview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Candidate: <strong>{applicant.student?.name}</strong> • {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Start Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>End Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Interview Mode</label>
            <select
              className="form-select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="online">Online (Video Conference)</option>
              <option value="in-person">In-Person (On Campus / Office)</option>
            </select>
          </div>

          {mode === 'online' ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Meeting Link (Google Meet, Zoom, Teams)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Interview Location / Room</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Placement Cell Conference Room B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Instructions / Notes (Optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Please join 5 mins early with your college ID card..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Scheduling...' : 'Send Interview Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;

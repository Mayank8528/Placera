import React, { useState } from 'react';
import api from '../services/api';

const RescheduleInterviewModal = ({ isOpen, onClose, interview, onRescheduled }) => {
  const [startTime, setStartTime] = useState(
    interview?.startTime ? new Date(interview.startTime).toISOString().slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    interview?.endTime ? new Date(interview.endTime).toISOString().slice(0, 16) : ''
  );
  const [mode, setMode] = useState(interview?.mode || 'online');
  const [meetingLink, setMeetingLink] = useState(interview?.meetingLink || '');
  const [location, setLocation] = useState(interview?.location || '');
  const [instructions, setInstructions] = useState(interview?.instructions || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !interview) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setError('End time must be after start time.');
      return;
    }

    if (start.getTime() < Date.now()) {
      setError('Cannot reschedule an interview in the past.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.put(`/interviews/${interview._id}/reschedule`, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        mode,
        meetingLink: mode === 'online' ? meetingLink.trim() : '',
        location: mode === 'in-person' ? location.trim() : '',
        instructions: instructions.trim(),
      });

      if (onRescheduled) {
        onRescheduled(res.data.interview);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Reschedule Interview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Candidate: <strong>{interview.studentId?.name}</strong> • {interview.jobId?.title}
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
              <label className="form-label" style={{ fontSize: '0.85rem' }}>New Start Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>New End Time</label>
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
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Meeting Link</label>
              <input
                type="url"
                className="form-input"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Location / Room</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>Updated Instructions</label>
            <textarea
              className="form-input"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleInterviewModal;

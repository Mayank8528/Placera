import React, { useState } from 'react';
import api from '../services/api';

const CancelInterviewModal = ({ isOpen, onClose, interview, onCancelled }) => {
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !interview) return null;

  const handleCancel = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.put(`/interviews/${interview._id}/cancel`, {
        cancellationReason: cancellationReason.trim(),
      });

      if (onCancelled) {
        onCancelled(res.data.interview);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f87171' }}>
            Cancel Interview
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Are you sure you want to cancel the interview with{' '}
          <strong style={{ color: 'var(--text-main)' }}>{interview.studentId?.name}</strong> for{' '}
          <strong style={{ color: 'var(--text-main)' }}>{interview.jobId?.title}</strong>? This action frees up the time slot and sends a cancellation notification to the candidate.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleCancel}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              Reason for Cancellation (Optional)
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Position filled, scheduling conflict, etc."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>
              Keep Interview
            </button>
            <button type="submit" className="btn btn-danger btn-sm" disabled={loading}>
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelInterviewModal;

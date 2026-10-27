import React, { useState } from 'react';
import { AlertTriangle, X, AlertCircle } from 'lucide-react';
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={17} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fca5a5' }}>
                Cancel Scheduled Interview
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-tertiary btn-sm"
            style={{ padding: '0.25rem', color: 'var(--text-dim)' }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
          Are you sure you want to cancel the interview with{' '}
          <strong style={{ color: 'var(--text-main)' }}>{interview.studentId?.name}</strong> for{' '}
          <strong style={{ color: 'var(--text-main)' }}>{interview.jobId?.title}</strong>? This frees up the time slot and immediately notifies the student.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCancel}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem' }}>
              Reason for Cancellation (Optional)
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Position filled, scheduling conflict with technical panel, etc."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
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

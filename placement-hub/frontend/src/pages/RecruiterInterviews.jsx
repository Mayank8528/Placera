import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RescheduleInterviewModal from '../components/RescheduleInterviewModal';
import CancelInterviewModal from '../components/CancelInterviewModal';

const RecruiterInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews/my');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleMarkComplete = async (interviewId) => {
    try {
      const res = await api.put(`/interviews/${interviewId}/complete`);
      setSuccessMessage('Interview marked as completed');
      setTimeout(() => setSuccessMessage(''), 3000);
      setInterviews((prev) =>
        prev.map((i) => (i._id === interviewId ? { ...i, status: 'completed' } : i))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete interview');
      setTimeout(() => setError(''), 4000);
    }
  };

  const filteredInterviews = interviews.filter((i) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ['proposed', 'confirmed'].includes(i.status);
    return i.status === filterStatus;
  });

  // Group by upcoming vs past
  const now = new Date();
  const upcoming = filteredInterviews.filter((i) => new Date(i.endTime) >= now && i.status !== 'cancelled' && i.status !== 'completed');
  const pastOrDone = filteredInterviews.filter((i) => new Date(i.endTime) < now || i.status === 'cancelled' || i.status === 'completed');

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your scheduled interviews...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
            Interview Management
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track scheduled interviews, respond to candidate statuses, reschedule, or complete sessions.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Statuses ({interviews.length})</option>
            <option value="active">Active (Proposed / Confirmed)</option>
            <option value="proposed">Proposed</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Upcoming Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🗓️ Active & Upcoming Interviews</span>
          <span className="role-pill" style={{ fontSize: '0.75rem' }}>{upcoming.length}</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No upcoming interviews scheduled under this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcoming.map((interview) => (
              <div key={interview._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.studentId?.name} — {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      Candidate Email: <strong>{interview.studentId?.email}</strong> • Mode: <span style={{ textTransform: 'capitalize', color: 'var(--accent-primary)', fontWeight: '600' }}>{interview.mode}</span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={interview.status} />

                    {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => setRescheduleTarget(interview)}
                          className="btn btn-secondary btn-sm"
                        >
                          🔄 Reschedule
                        </button>
                        <button
                          onClick={() => setCancelTarget(interview)}
                          className="btn btn-danger btn-sm"
                        >
                          ✕ Cancel
                        </button>
                        {interview.status === 'confirmed' && (
                          <button
                            onClick={() => handleMarkComplete(interview._id)}
                            className="btn btn-primary btn-sm"
                          >
                            ✓ Mark Completed
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Interview Timing & Details Box */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Date</span>
                    <strong>{new Date(interview.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Time Window</span>
                    <strong>
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(interview.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Location / Link</span>
                    {interview.mode === 'online' ? (
                      interview.meetingLink ? (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                          Join Online Meeting 🔗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Link not provided yet</span>
                      )
                    ) : (
                      <span>{interview.location || 'Campus / Office'}</span>
                    )}
                  </div>
                </div>

                {interview.instructions && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--text-dim)' }}>Instructions: </strong> {interview.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Completed / Cancelled Section */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📜 Past, Completed & Cancelled Interviews</span>
          <span className="role-pill" style={{ fontSize: '0.75rem' }}>{pastOrDone.length}</span>
        </h2>

        {pastOrDone.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No past or closed interviews to show.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pastOrDone.map((interview) => (
              <div key={interview._id} className="card" style={{ opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.studentId?.name} — {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(interview.startTime).toLocaleDateString()} at{' '}
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mode: {interview.mode}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={interview.status} />
                  </div>
                </div>

                {interview.cancellationReason && (
                  <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginTop: '0.3rem' }}>
                    <strong>Cancellation Reason:</strong> {interview.cancellationReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <RescheduleInterviewModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          interview={rescheduleTarget}
          onRescheduled={(updated) => {
            setSuccessMessage(`Interview rescheduled to ${new Date(updated.startTime).toLocaleString()}`);
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchInterviews();
          }}
        />
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelInterviewModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          interview={cancelTarget}
          onCancelled={(updated) => {
            setSuccessMessage('Interview cancelled');
            setTimeout(() => setSuccessMessage(''), 3000);
            fetchInterviews();
          }}
        />
      )}
    </div>
  );
};

export default RecruiterInterviews;

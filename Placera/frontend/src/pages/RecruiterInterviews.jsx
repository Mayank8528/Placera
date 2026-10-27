import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  RotateCcw,
  Check,
  Filter,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
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

  const now = new Date();
  const upcoming = filteredInterviews.filter(
    (i) => new Date(i.endTime) >= now && i.status !== 'cancelled' && i.status !== 'completed'
  );
  const pastOrDone = filteredInterviews.filter(
    (i) => new Date(i.endTime) < now || i.status === 'cancelled' || i.status === 'completed'
  );

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
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/recruiter/dashboard">Hiring Workspace</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Interviews</span>
          </div>
          <h1 className="page-title">Interview Coordination</h1>
          <p className="page-subtitle">
            Coordinate candidate rounds, inspect confirmation states, reschedule sessions, or complete assessments.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', fontSize: '0.82rem' }}
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

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <CheckCircle size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Upcoming & Active Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
            Active & Upcoming Sessions
          </h2>
          <span className="role-pill">{upcoming.length} active</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3>No active interviews in this view</h3>
            <p>Shortlist candidates from your job postings and schedule evaluation rounds.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcoming.map((interview) => (
              <div key={interview._id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.studentId?.name} — {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Candidate Email: <strong style={{ color: 'var(--text-secondary)' }}>{interview.studentId?.email}</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={interview.status} />

                    {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRescheduleTarget(interview)}
                          className="btn btn-secondary btn-sm"
                        >
                          <RotateCcw size={12} /> Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(interview)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
                        </button>
                        {interview.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(interview._id)}
                            className="btn btn-primary btn-sm"
                          >
                            <Check size={13} /> Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Timing Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Date & Day</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {new Date(interview.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Window</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(interview.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Channel / Mode</span>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{interview.mode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Meeting Link / Venue</span>
                    {interview.mode === 'online' ? (
                      interview.meetingLink ? (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#818cf8', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          Join Call <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>No meeting URL set</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-main)' }}>{interview.location || 'On-campus placement hall'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Cancelled / Completed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--text-dim)' }} />
            Completed & Closed Sessions
          </h2>
          <span className="role-pill">{pastOrDone.length} past</span>
        </div>

        {pastOrDone.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No past interviews in this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastOrDone.map((interview) => (
              <div key={interview._id} className="card" style={{ padding: '1rem 1.25rem', opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {interview.studentId?.name} — {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(interview.startTime).toLocaleDateString()} at{' '}
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mode: {interview.mode}
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={interview.status} />
                  </div>
                </div>

                {interview.cancellationReason && (
                  <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                    <strong>Cancellation Note:</strong> {interview.cancellationReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <RescheduleInterviewModal
          isOpen={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          interview={rescheduleTarget}
          onRescheduled={(updated) => {
            setSuccessMessage('Interview slot rescheduled and notification sent');
            setInterviews((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
            setTimeout(() => setSuccessMessage(''), 4000);
          }}
        />
      )}

      {cancelTarget && (
        <CancelInterviewModal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          interview={cancelTarget}
          onCancelled={(updated) => {
            setSuccessMessage('Interview cancelled and time slot released');
            setInterviews((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
            setTimeout(() => setSuccessMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default RecruiterInterviews;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  ExternalLink,
  Info,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const StudentInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [respondingId, setRespondingId] = useState(null);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews/my');
      setInterviews(res.data.interviews || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleRespond = async (interviewId, response) => {
    try {
      setRespondingId(interviewId);
      setError('');
      const res = await api.put(`/interviews/${interviewId}/respond`, { response });
      setActionSuccess(`Interview invitation successfully ${res.data.interview.status}!`);
      setTimeout(() => setActionSuccess(''), 4000);

      setInterviews((prev) =>
        prev.map((i) => (i._id === interviewId ? res.data.interview : i))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to respond to interview proposal');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRespondingId(null);
    }
  };

  const now = new Date();
  const upcoming = interviews.filter(
    (i) => new Date(i.endTime) >= now && i.status !== 'cancelled' && i.status !== 'declined'
  );
  const pastOrClosed = interviews.filter(
    (i) => new Date(i.endTime) < now || i.status === 'cancelled' || i.status === 'declined'
  );

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading scheduled interviews...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/student/dashboard">Portal</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Interviews</span>
          </div>
          <h1 className="page-title">My Scheduled Interviews</h1>
          <p className="page-subtitle">
            Review proposed interview slots, confirm your availability, and access meeting links.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" role="alert">
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Upcoming & Proposed Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
            Active & Upcoming Rounds
          </h2>
          <span className="role-pill">{upcoming.length} upcoming</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3>No upcoming interviews scheduled</h3>
            <p>When a hiring partner shortlists your profile and schedules an evaluation slot, it will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcoming.map((interview) => (
              <div key={interview._id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {interview.jobId?.companyName}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={interview.status} />

                    {interview.status === 'proposed' && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRespond(interview._id, 'confirm')}
                          disabled={respondingId === interview._id}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={14} /> Confirm Attendance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(interview._id, 'decline')}
                          disabled={respondingId === interview._id}
                          className="btn btn-danger btn-sm"
                        >
                          <X size={14} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing & Channel Strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: interview.instructions ? '0.75rem' : 0,
                }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Date</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {new Date(interview.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Time Slot</span>
                    <strong style={{ color: 'var(--text-main)' }}>
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(interview.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Mode</span>
                    <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{interview.mode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600' }}>Meeting Link / Venue</span>
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
                        <span style={{ color: 'var(--text-dim)' }}>Link pending recruiter dispatch</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-main)' }}>{interview.location || 'College Placement Hall'}</span>
                    )}
                  </div>
                </div>

                {interview.instructions && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <Info size={14} style={{ color: 'var(--text-dim)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--text-secondary)' }}>Instructions: </strong>
                      {interview.instructions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Declined / Cancelled Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: 'var(--text-dim)' }} />
            Past & Completed Sessions
          </h2>
          <span className="role-pill">{pastOrClosed.length} completed/cancelled</span>
        </div>

        {pastOrClosed.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No past interview history recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastOrClosed.map((interview) => (
              <div key={interview._id} className="card" style={{ padding: '1rem 1.25rem', opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      {interview.jobId?.title} • {interview.jobId?.companyName}
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
                    <strong>Reason:</strong> {interview.cancellationReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentInterviews;

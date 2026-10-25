import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      setActionSuccess(`Interview successfully ${res.data.interview.status}!`);
      setTimeout(() => setActionSuccess(''), 4000);

      // Update state locally
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
  const upcoming = interviews.filter((i) => new Date(i.endTime) >= now && i.status !== 'cancelled' && i.status !== 'declined');
  const pastOrClosed = interviews.filter((i) => new Date(i.endTime) < now || i.status === 'cancelled' || i.status === 'declined');

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your interviews...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          My Scheduled Interviews
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review proposed interviews from recruiters, confirm your attendance, and access meeting links.
        </p>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Upcoming & Proposed Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🗓️ Upcoming & Proposed Interviews</span>
          <span className="role-pill" style={{ fontSize: '0.75rem' }}>{upcoming.length}</span>
        </h2>

        {upcoming.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <h3>No upcoming interviews</h3>
            <p>When a recruiter shortlists your profile and schedules an interview, it will appear here.</p>
            <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop: '0.8rem' }}>
              Explore Jobs
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {upcoming.map((interview) => (
              <div key={interview._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.jobId?.title}
                    </h3>
                    <p style={{ color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.95rem' }}>
                      {interview.jobId?.companyName}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={interview.status} />

                    {interview.status === 'proposed' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleRespond(interview._id, 'confirm')}
                          disabled={respondingId === interview._id}
                          className="btn btn-primary btn-sm"
                        >
                          ✓ Confirm Attendance
                        </button>
                        <button
                          onClick={() => handleRespond(interview._id, 'decline')}
                          disabled={respondingId === interview._id}
                          className="btn btn-danger btn-sm"
                        >
                          ✕ Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing & Details Box */}
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
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Mode</span>
                    <strong style={{ textTransform: 'capitalize' }}>{interview.mode}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Access / Location</span>
                    {interview.mode === 'online' ? (
                      interview.meetingLink ? (
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: '600' }}>
                          Open Meeting Room 🔗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Link will be provided before interview</span>
                      )
                    ) : (
                      <span>{interview.location || 'College Placement Hall'}</span>
                    )}
                  </div>
                </div>

                {interview.instructions && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong style={{ color: 'var(--text-dim)' }}>Special Instructions: </strong> {interview.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Declined / Cancelled Section */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📜 Past & Completed Interviews</span>
          <span className="role-pill" style={{ fontSize: '0.75rem' }}>{pastOrClosed.length}</span>
        </h2>

        {pastOrClosed.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>No past interview history yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pastOrClosed.map((interview) => (
              <div key={interview._id} className="card" style={{ opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {interview.jobId?.title} — {interview.jobId?.companyName}
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
    </div>
  );
};

export default StudentInterviews;

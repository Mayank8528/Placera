import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';

const JobApplicants = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [selectedApplicantForInterview, setSelectedApplicantForInterview] = useState(null);

  const fetchApplicants = async () => {
    try {
      const res = await api.get(`/applications/job/${jobId}`);
      setJob(res.data.job);
      setApplicants(res.data.applicants || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants for this job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      setStatusUpdateMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setStatusUpdateMessage(''), 3000);

      // Update state locally
      setApplicants((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading candidate applications...</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/recruiter/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        &larr; Back to My Postings
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          Applicants for: {job?.title}
        </h1>
        <p style={{ color: 'var(--accent-primary)', fontWeight: '600', fontSize: '1.1rem' }}>
          {job?.companyName}
        </p>
      </div>

      {statusUpdateMessage && <div className="alert alert-success">{statusUpdateMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {applicants.length === 0 ? (
        <div className="empty-state">
          <h3>No applications received yet</h3>
          <p>Eligible students have not submitted applications for this posting yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {applicants.map((app) => (
            <div key={app._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    {app.student.name}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>✉️ {app.student.email}</span>
                    {app.student.phone && <span>📞 {app.student.phone}</span>}
                    <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <StatusBadge status={app.status} />

                  {/* Status update selector */}
                  <select
                    className="form-select"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* Schedule Interview button (strictly for Shortlisted applicants) */}
                  {app.status === 'Shortlisted' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                      onClick={() => setSelectedApplicantForInterview(app)}
                    >
                      🗓️ Schedule Interview
                    </button>
                  )}
                </div>
              </div>

              {/* Student Academic Details & Resume */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>College</span>
                  <strong>{app.student.college || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Branch / Major</span>
                  <strong>{app.student.branch || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Graduation Year</span>
                  <strong>{app.student.graduationYear || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', display: 'block' }}>Resume</span>
                  {app.student.resumeUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/students/${app.student._id}/resume`);
                            if (res.data.resumeUrl) {
                              window.open(res.data.resumeUrl, '_blank', 'noopener,noreferrer');
                            }
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to open resume.');
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                      >
                        📄 View Resume
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      Resume not uploaded
                    </span>
                  )}
                </div>
              </div>

              {/* Student Skills */}
              {app.student.skills && app.student.skills.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>
                    Declared Skills:
                  </span>
                  <div className="tags" style={{ marginTop: '0.3rem' }}>
                    {app.student.skills.map((skill, idx) => (
                      <span key={idx} className="tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedApplicantForInterview && (
        <ScheduleInterviewModal
          isOpen={!!selectedApplicantForInterview}
          onClose={() => setSelectedApplicantForInterview(null)}
          applicant={selectedApplicantForInterview}
          jobId={jobId}
          jobTitle={job?.title || 'Job Opening'}
          onScheduled={(interview) => {
            setStatusUpdateMessage(
              `Interview proposal sent successfully to ${selectedApplicantForInterview.student?.name}!`
            );
            setTimeout(() => setStatusUpdateMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default JobApplicants;

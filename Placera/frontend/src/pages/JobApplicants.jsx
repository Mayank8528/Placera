import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Calendar,
  FileText,
  Mail,
  Phone,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
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
      <div className="breadcrumbs" style={{ marginBottom: '1.25rem' }}>
        <Link to="/recruiter/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={13} /> Back to My Postings
        </Link>
        <span className="breadcrumbs-separator">/</span>
        <span style={{ color: 'var(--text-main)' }}>Applicants</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            Candidates for: {job?.title}
          </h1>
          <p className="page-subtitle">
            {job?.companyName} • {applicants.length} total applicant{applicants.length !== 1 ? 's' : ''} received
          </p>
        </div>
      </div>

      {statusUpdateMessage && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{statusUpdateMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {applicants.length === 0 ? (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3>No applications received yet</h3>
          <p>Eligible students have not submitted their profiles for this drive yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applicants.map((app) => (
            <div key={app._id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {app.student.name}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={13} /> {app.student.email}
                    </span>
                    {app.student.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={13} /> {app.student.phone}
                      </span>
                    )}
                    <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <StatusBadge status={app.status} />

                  {/* Status update dropdown selector */}
                  <select
                    className="form-select"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', width: 'auto' }}
                    value={app.status}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* Schedule Interview (enabled for Shortlisted candidates) */}
                  {app.status === 'Shortlisted' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedApplicantForInterview(app)}
                    >
                      <Calendar size={13} /> Schedule Interview
                    </button>
                  )}
                </div>
              </div>

              {/* Student Academic Details & Resume View */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>College</span>
                  <strong style={{ color: 'var(--text-main)' }}>{app.student.college || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Branch / Major</span>
                  <strong style={{ color: 'var(--text-main)' }}>{app.student.branch || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Graduation Year</span>
                  <strong style={{ color: 'var(--text-main)' }}>{app.student.graduationYear || 'Not specified'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Resume</span>
                  {app.student.resumeUrl ? (
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
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginTop: '0.2rem' }}
                    >
                      <FileText size={12} /> View PDF Resume
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No resume uploaded
                    </span>
                  )}
                </div>
              </div>

              {/* Skills */}
              {app.student.skills && app.student.skills.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="tags">
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
          onScheduled={() => {
            setStatusUpdateMessage(
              `Interview proposal dispatched successfully to ${selectedApplicantForInterview.student?.name}!`
            );
            setTimeout(() => setStatusUpdateMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default JobApplicants;

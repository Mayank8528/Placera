import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Banknote,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Share2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    const fetchJobAndApplicationStatus = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data.job);

        // If user is a student, check if they have already applied
        if (isAuthenticated && user?.role === 'student') {
          try {
            const myAppsRes = await api.get('/applications/my');
            const hasApplied = (myAppsRes.data.applications || []).some(
              (app) => app.jobId && app.jobId._id === id
            );
            setAlreadyApplied(hasApplied);
          } catch (appErr) {
            console.error('Failed to check user applications', appErr);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndApplicationStatus();
  }, [id, isAuthenticated, user]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setApplyError('');
    setApplySuccess('');
    setApplyLoading(true);

    try {
      const res = await api.post('/applications', { jobId: id });
      setApplySuccess(res.data.message || 'Application submitted successfully!');
      setAlreadyApplied(true);
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading position details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="card" style={{ textAlign: 'center', margin: '2rem auto', maxWidth: '540px' }}>
        <p style={{ color: '#fca5a5', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error || 'The requested job posting was not found or has been removed.'}
        </p>
        <Link to="/jobs" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Drives
        </Link>
      </div>
    );
  }

  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="breadcrumbs" style={{ marginBottom: '1.25rem' }}>
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={13} /> Back to Openings
        </Link>
        <span className="breadcrumbs-separator">/</span>
        <span style={{ color: 'var(--text-main)' }}>{job.title}</span>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {/* Header section with status pill and Action Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Building size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {job.companyName}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: '1.25' }}>
              {job.title}
            </h1>
          </div>

          <div>
            {isExpired ? (
              <span className="badge badge-rejected" style={{ padding: '0.35rem 0.85rem' }}>
                Applications Closed
              </span>
            ) : alreadyApplied ? (
              <span className="badge badge-selected" style={{ padding: '0.35rem 0.85rem' }}>
                <CheckCircle2 size={13} /> Application Submitted
              </span>
            ) : user?.role === 'student' ? (
              <button
                type="button"
                onClick={handleApply}
                disabled={applyLoading}
                className="btn btn-primary"
              >
                {applyLoading ? 'Submitting...' : 'Apply for Position'}
              </button>
            ) : !isAuthenticated ? (
              <Link to="/login" className="btn btn-primary">
                Sign in to Apply
              </Link>
            ) : null}
          </div>
        </div>

        {applySuccess && (
          <div className="alert alert-success" style={{ marginTop: '1.25rem' }}>
            <CheckCircle2 size={16} />
            <span>{applySuccess}</span>
          </div>
        )}

        {applyError && (
          <div className="alert alert-error" style={{ marginTop: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{applyError}</span>
          </div>
        )}

        {/* Highlighted Attribute Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          margin: '1.5rem 0',
        }}>
          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={12} /> Work Location
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {job.location}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Banknote size={12} /> Compensation (CTC)
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {job.salary}
            </div>
          </div>

          <div className="card" style={{ padding: '1rem', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={12} /> Deadline
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: isExpired ? '#fca5a5' : 'var(--text-main)', marginTop: '0.35rem' }}>
              {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Required Skills Section */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
            Candidate Requirements & Skills
          </h2>
          {job.requiredSkills && job.requiredSkills.length > 0 ? (
            <div className="tags">
              {job.requiredSkills.map((skill, idx) => (
                <span key={idx} className="tag" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Open to all engineering / graduation disciplines.</p>
          )}
        </div>

        {/* Job Description */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
            Role Description & Selection Criteria
          </h2>
          <div
            style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.65',
              fontSize: '0.9rem',
              whiteSpace: 'pre-line',
              padding: '1rem 1.25rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {job.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
      <div className="card" style={{ textAlign: 'center', margin: '2rem auto', maxWidth: '600px' }}>
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error || 'Job not found'}</p>
        <Link to="/jobs" className="btn btn-secondary">
          &larr; Back to Listings
        </Link>
      </div>
    );
  }

  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        &larr; Back to all opportunities
      </Link>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
              {job.title}
            </h1>
            <p style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: '700' }}>
              {job.companyName}
            </p>
          </div>

          <div>
            {isExpired ? (
              <span className="badge badge-rejected" style={{ fontSize: '0.9rem' }}>
                Applications Closed
              </span>
            ) : alreadyApplied ? (
              <span className="badge badge-selected" style={{ fontSize: '0.9rem' }}>
                ✓ You Applied for this Job
              </span>
            ) : user?.role === 'student' ? (
              <button
                onClick={handleApply}
                disabled={applyLoading}
                className="btn btn-primary"
              >
                {applyLoading ? 'Submitting...' : 'Apply Now'}
              </button>
            ) : !isAuthenticated ? (
              <Link to="/login" className="btn btn-primary">
                Sign in to Apply
              </Link>
            ) : null}
          </div>
        </div>

        {applySuccess && <div className="alert alert-success">{applySuccess}</div>}
        {applyError && <div className="alert alert-error">{applyError}</div>}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 'var(--radius-md)',
          margin: '1.5rem 0',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Location</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>📍 {job.location}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Package / CTC</span>
            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>💰 {job.salary}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Application Deadline</span>
            <strong style={{ fontSize: '1rem', color: isExpired ? '#f87171' : 'var(--text-main)' }}>
              📅 {new Date(job.deadline).toLocaleDateString()}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.6rem' }}>Required Skills</h3>
          {job.requiredSkills && job.requiredSkills.length > 0 ? (
            <div className="tags">
              {job.requiredSkills.map((skill, idx) => (
                <span key={idx} className="tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No specific skills specified</p>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.6rem' }}>Job Description</h3>
          <div style={{ color: 'var(--text-muted)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
            {job.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;

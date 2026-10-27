import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import JobCard from '../components/JobCard';

const RecruiterJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/recruiter/my');
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleEdit = (id) => {
    navigate(`/recruiter/jobs/${id}/edit`);
  };

  const handleDelete = async (id) => {
    // Confirmation before destructive action
    const confirmed = window.confirm(
      'Are you sure you want to delete this job posting? All student applications for this position will also be permanently removed.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/jobs/${id}`);
      setDeleteSuccess('Job posting deleted successfully');
      setJobs((prev) => prev.filter((j) => j._id !== id));
      setTimeout(() => setDeleteSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job posting');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
            My Job Postings
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Review, edit, or check applications for all jobs posted by your organization.
          </p>
        </div>
        <div>
          <Link to="/recruiter/jobs/create" className="btn btn-primary">
            + Post New Opening
          </Link>
        </div>
      </div>

      {deleteSuccess && <div className="alert alert-success">{deleteSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your job listings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <h3>No jobs created yet</h3>
          <p>You haven't posted any campus recruitment drives yet.</p>
          <Link to="/recruiter/jobs/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Post a Job Now
          </Link>
        </div>
      ) : (
        <div className="grid-cards">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              isRecruiterView={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterJobs;

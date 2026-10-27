import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/recruiter/dashboard">Hiring Workspace</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Job Postings</span>
          </div>
          <h1 className="page-title">My Campus Drives & Postings</h1>
          <p className="page-subtitle">
            Manage your recruitment listings, update deadlines, and inspect applicants.
          </p>
        </div>
        <div>
          <Link to="/recruiter/jobs/create" className="btn btn-primary btn-sm">
            <PlusCircle size={14} /> Post New Opening
          </Link>
        </div>
      </div>

      {deleteSuccess && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your job listings...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase className="empty-state-icon" />
          <h3>No recruitment drives created yet</h3>
          <p>Publish an opening to begin receiving student profiles and scheduling interviews.</p>
          <Link to="/recruiter/jobs/create" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            <PlusCircle size={14} /> Post a Job Now
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

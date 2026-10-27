import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [jobsRes, interviewsRes] = await Promise.all([
          api.get('/jobs/recruiter/my'),
          api.get('/interviews/my'),
        ]);
        setJobs(jobsRes.data.jobs || []);
        setInterviews(interviewsRes.data.interviews || []);
      } catch (err) {
        console.error('Failed to load recruiter data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading recruiter portal...</p>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => new Date(j.deadline) >= new Date()).length;
  const activeInterviews = interviews.filter((i) => ['proposed', 'confirmed'].includes(i.status)).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
            Recruiter Portal — {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Manage campus recruitment drives, schedule interviews, and evaluate candidate stages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/recruiter/interviews" className="btn btn-secondary">
            🗓️ Interviews
          </Link>
          <Link to="/recruiter/jobs/create" className="btn btn-primary">
            + Post Opening
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Job Postings</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#60a5fa' }}>{jobs.length}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Drives</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#34d399' }}>{activeJobs}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Interviews</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#c084fc' }}>
            <Link to="/recruiter/interviews" style={{ color: 'inherit' }}>
              {activeInterviews}
            </Link>
          </h2>
        </div>
      </div>

      {/* Quick Access to My Jobs */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Your Recent Job Postings</h3>
          <Link to="/recruiter/jobs" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
            Manage All Jobs &rarr;
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <h3>No job postings yet</h3>
            <p>Create your first job listing to start receiving campus applications.</p>
            <Link to="/recruiter/jobs/create" className="btn btn-primary btn-sm" style={{ marginTop: '0.8rem' }}>
              Create Job Posting
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Job Title</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Company</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Deadline</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600' }}>{job.title}</td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{job.companyName}</td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{job.location}</td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-primary btn-sm">
                        View Applicants
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Users,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';
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
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <span>Recruiter Console</span>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Overview</span>
          </div>
          <h1 className="page-title">
            Hiring Portal — {user?.name}
          </h1>
          <p className="page-subtitle">
            Manage your organization's campus drives, screen candidate applications, and coordinate evaluation interviews.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/recruiter/interviews" className="btn btn-secondary btn-sm">
            <Calendar size={14} /> Interviews
          </Link>
          <Link to="/recruiter/jobs/create" className="btn btn-primary btn-sm">
            <PlusCircle size={14} /> Post Opening
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Job Postings</span>
            <div className="metric-icon-wrap">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="metric-value">{jobs.length}</div>
          <div className="metric-caption">Campus drives created</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Drives</span>
            <div className="metric-icon-wrap" style={{ color: '#34d399' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#6ee7b7' }}>{activeJobs}</div>
          <div className="metric-caption">Accepting applications</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Interviews</span>
            <div className="metric-icon-wrap" style={{ color: '#c084fc' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#d8b4fe' }}>
            <Link to="/recruiter/interviews">{activeInterviews}</Link>
          </div>
          <div className="metric-caption">Proposed or confirmed slots</div>
        </div>
      </div>

      {/* Quick Access to Recent Postings */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <Briefcase size={18} style={{ color: 'var(--accent-primary)' }} />
            Recent Postings
          </h2>
          <Link to="/recruiter/jobs" style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            Manage all ({jobs.length}) <ArrowRight size={13} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state" style={{ margin: '1.5rem', background: 'transparent' }}>
            <Briefcase className="empty-state-icon" />
            <h3>No job postings yet</h3>
            <p>Create your first recruitment drive listing to begin receiving campus applications.</p>
            <Link to="/recruiter/jobs/create" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              <PlusCircle size={14} /> Create Job Posting
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Deadline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job._id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{job.title}</td>
                    <td>{job.companyName}</td>
                    <td>{job.location}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-primary btn-sm" style={{ fontSize: '0.78rem' }}>
                        <Users size={12} /> Applicants
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

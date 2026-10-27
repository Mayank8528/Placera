import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, ExternalLink, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/applications/my');
        setApplications(res.data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <Link to="/student/dashboard">Portal</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Applications</span>
          </div>
          <h1 className="page-title">My Job Applications</h1>
          <p className="page-subtitle">
            Track evaluation phases, shortlisting results, and final recruitment decisions.
          </p>
        </div>
        <div>
          <Link to="/jobs" className="btn btn-primary btn-sm">
            <Briefcase size={14} /> Browse New Drives
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <h3>No applications submitted yet</h3>
          <p>You have not applied to any campus drives. Discover openings and submit your candidature.</p>
          <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
            <Briefcase size={14} /> Browse Available Openings
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title & Company</th>
                  <th>Location</th>
                  <th>Package / CTC</th>
                  <th>Application Date</th>
                  <th>Review Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      {app.jobId ? (
                        <>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{app.jobId.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.jobId.companyName}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Job posting removed</span>
                      )}
                    </td>
                    <td>{app.jobId?.location || '—'}</td>
                    <td>{app.jobId?.salary || '—'}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {app.jobId && (
                        <Link to={`/jobs/${app.jobId._id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                          View Posting <ExternalLink size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentApplications;

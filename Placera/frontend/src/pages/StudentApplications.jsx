import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          My Job Applications
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review the status of all positions and campus drives you have submitted an application for.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <h3>No applications submitted yet</h3>
          <p>Explore current campus drives and apply to begin tracking your status here.</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Browse Available Openings
          </Link>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Position & Company</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Salary / CTC</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date Applied</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Current Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {app.jobId ? (
                        <>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{app.jobId.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>{app.jobId.companyName}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Job posting removed</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {app.jobId?.location || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {app.jobId?.salary || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      {app.jobId && (
                        <Link to={`/jobs/${app.jobId._id}`} className="btn btn-secondary btn-sm">
                          View Job
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

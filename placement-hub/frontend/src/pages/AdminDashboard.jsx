import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'users'

  const fetchAdminData = async () => {
    try {
      const [usersRes, jobsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/jobs'),
      ]);
      setUsers(usersRes.data.users || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrative records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteJob = async (jobId) => {
    const confirmed = window.confirm(
      'Administrative action: Are you sure you want to delete this job listing? It will also wipe associated student applications.'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setActionSuccess('Job listing removed successfully by Admin');
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading administration portal...</p>
      </div>
    );
  }

  const studentCount = users.filter((u) => u.role === 'student').length;
  const recruiterCount = users.filter((u) => u.role === 'recruiter').length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          PlacementHub Administration
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          System-wide oversight for registered students, recruiting companies, and campus job drives.
        </p>
      </div>

      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Students</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#60a5fa' }}>{studentCount}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Recruiters</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#a78bfa' }}>{recruiterCount}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Job Postings</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#34d399' }}>{jobs.length}</h2>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-medium)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          Manage Job Listings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
        >
          View Registered Users ({users.length})
        </button>
      </div>

      {/* Tab Content: Jobs */}
      {activeTab === 'jobs' && (
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>
            All Campus Job Drives
          </h3>

          {jobs.length === 0 ? (
            <div className="empty-state">No job listings found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role Title</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Company</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Posted By (Recruiter)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Deadline</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600' }}>{job.title}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--accent-primary)' }}>{job.companyName}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {job.postedBy ? `${job.postedBy.name} (${job.postedBy.email})` : 'Unknown'}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{job.location}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        {new Date(job.deadline).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Remove Job
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>
            Registered Users Directory
          </h3>

          {users.length === 0 ? (
            <div className="empty-state">No users registered yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email Address</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>System Role</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600' }}>{u.name}</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className="role-pill" style={{
                          backgroundColor: u.role === 'admin' ? 'rgba(239,68,68,0.2)' : u.role === 'recruiter' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)',
                          color: u.role === 'admin' ? '#f87171' : u.role === 'recruiter' ? '#c084fc' : '#60a5fa',
                          borderColor: 'transparent'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

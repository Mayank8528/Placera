import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Calendar,
  Search
} from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'users'
  const [searchFilter, setSearchFilter] = useState('');

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
      'Administrative action: Are you sure you want to remove this job listing? It will also wipe associated candidate applications.'
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

  const filteredJobs = jobs.filter((j) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      j.title?.toLowerCase().includes(q) ||
      j.companyName?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <span>Admin Console</span>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Moderation</span>
          </div>
          <h1 className="page-title">Placera Administration Console</h1>
          <p className="page-subtitle">
            System-wide oversight for student records, corporate recruiters, and campus job drives.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Registered Students</span>
            <div className="metric-icon-wrap" style={{ color: '#60a5fa' }}>
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="metric-value">{studentCount}</div>
          <div className="metric-caption">Active candidate profiles</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Recruiters</span>
            <div className="metric-icon-wrap" style={{ color: '#c084fc' }}>
              <Building size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#d8b4fe' }}>{recruiterCount}</div>
          <div className="metric-caption">Hiring organizations</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Job Postings</span>
            <div className="metric-icon-wrap" style={{ color: '#34d399' }}>
              <Briefcase size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#6ee7b7' }}>{jobs.length}</div>
          <div className="metric-caption">Campus recruitment drives</div>
        </div>
      </div>

      {/* Tab Switcher & Search Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('jobs'); setSearchFilter(''); }}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'jobs' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'jobs' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            Job Drives ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('users'); setSearchFilter(''); }}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'users' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            User Directory ({users.length})
          </button>
        </div>

        <div className="input-with-icon" style={{ maxWidth: '300px' }}>
          <Search className="input-icon-left" />
          <input
            type="text"
            className="form-input"
            placeholder={activeTab === 'jobs' ? 'Filter jobs...' : 'Filter users...'}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* Tab Content: Jobs */}
      {activeTab === 'jobs' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredJobs.length === 0 ? (
            <div className="empty-state" style={{ margin: '1.5rem', background: 'transparent' }}>
              <Briefcase className="empty-state-icon" />
              <h3>No job listings match</h3>
              <p>{searchFilter ? 'Try clearing your search query.' : 'No jobs created yet.'}</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role Title</th>
                    <th>Company</th>
                    <th>Posted By</th>
                    <th>Location</th>
                    <th>Deadline</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job._id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{job.title}</td>
                      <td>{job.companyName}</td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {job.postedBy ? `${job.postedBy.name} (${job.postedBy.email})` : 'Unknown'}
                      </td>
                      <td>{job.location}</td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {new Date(job.deadline).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job._id)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <Trash2 size={12} /> Remove
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
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredUsers.length === 0 ? (
            <div className="empty-state" style={{ margin: '1.5rem', background: 'transparent' }}>
              <Users className="empty-state-icon" />
              <h3>No users found</h3>
              <p>No user accounts matched the filter.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span
                          className="role-pill"
                          style={{
                            color:
                              u.role === 'admin'
                                ? '#f87171'
                                : u.role === 'recruiter'
                                ? '#c084fc'
                                : '#60a5fa',
                            backgroundColor:
                              u.role === 'admin'
                                ? 'rgba(239,68,68,0.1)'
                                : u.role === 'recruiter'
                                ? 'rgba(168,85,247,0.1)'
                                : 'rgba(59,130,246,0.1)',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
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

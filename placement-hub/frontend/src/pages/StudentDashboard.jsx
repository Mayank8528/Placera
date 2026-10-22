import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profileRes, appsRes] = await Promise.all([
          api.get('/students/profile'),
          api.get('/applications/my'),
        ]);
        setProfile(profileRes.data.profile);
        setApplications(appsRes.data.applications || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const selectedCount = applications.filter((a) => a.status === 'Selected').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          Welcome back, {user?.name}! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Track your campus job applications and placement progress in one place.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Applications</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#60a5fa' }}>{applications.length}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shortlisted</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#fbbf24' }}>{shortlistedCount}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Offers / Selected</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '0.3rem', color: '#34d399' }}>{selectedCount}</h2>
        </div>
      </div>

      {/* Profile summary & quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Academic Profile</h3>
            <Link to="/student/profile" className="btn btn-secondary btn-sm">Edit Profile</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <div><strong style={{ color: 'var(--text-dim)' }}>College: </strong>{profile?.college || 'Not set'}</div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Branch: </strong>{profile?.branch || 'Not set'}</div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Graduation Year: </strong>{profile?.graduationYear || 'Not set'}</div>
            <div><strong style={{ color: 'var(--text-dim)' }}>Phone: </strong>{profile?.phone || 'Not set'}</div>
            <div>
              <strong style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '0.3rem' }}>Skills:</strong>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="tags">
                  {profile.skills.map((s, idx) => <span key={idx} className="tag">{s}</span>)}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No skills added yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.5rem' }}>Ready for new opportunities?</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Check out newly posted recruitment drives and apply today.
          </p>
          <div>
            <Link to="/jobs" className="btn btn-primary">Browse All Openings</Link>
          </div>
        </div>
      </div>

      {/* Recent Applications table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Applications</h3>
          <Link to="/student/applications" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
            View All ({applications.length}) &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <p>You haven't applied to any jobs yet.</p>
            <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop: '0.8rem' }}>Browse Jobs</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Job Title</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Company</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Applied On</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: '600' }}>
                      {app.jobId ? (
                        <Link to={`/jobs/${app.jobId._id}`} style={{ color: 'var(--text-main)' }}>
                          {app.jobId.title}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>[Job Deleted]</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>
                      {app.jobId?.companyName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <StatusBadge status={app.status} />
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

export default StudentDashboard;

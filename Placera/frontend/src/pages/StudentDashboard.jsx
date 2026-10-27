import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Calendar,
  Award,
  ArrowRight,
  User,
  GraduationCap,
  Sparkles,
  Clock,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profileRes, appsRes, interviewsRes] = await Promise.all([
          api.get('/students/profile'),
          api.get('/applications/my'),
          api.get('/interviews/my'),
        ]);
        setProfile(profileRes.data.profile);
        setApplications(appsRes.data.applications || []);
        setInterviews(interviewsRes.data.interviews || []);
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
        <p>Loading your placement dashboard...</p>
      </div>
    );
  }

  const selectedCount = applications.filter((a) => a.status === 'Selected').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const activeInterviews = interviews.filter((i) => ['proposed', 'confirmed'].includes(i.status));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumbs">
            <span>Student Portal</span>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Dashboard</span>
          </div>
          <h1 className="page-title">
            Welcome back, {user?.name}
          </h1>
          <p className="page-subtitle">
            Overview of your placement drive applications, scheduled interviews, and verified academic record.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/jobs" className="btn btn-primary btn-sm">
            <Briefcase size={14} /> Explore Drives
          </Link>
          <Link to="/student/profile" className="btn btn-secondary btn-sm">
            <User size={14} /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Applications</span>
            <div className="metric-icon-wrap">
              <FileText size={16} />
            </div>
          </div>
          <div className="metric-value">{applications.length}</div>
          <div className="metric-caption">Submitted campus drives</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Shortlisted</span>
            <div className="metric-icon-wrap" style={{ color: '#fbbf24' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#fde68a' }}>{shortlistedCount}</div>
          <div className="metric-caption">Qualified for next rounds</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Interviews</span>
            <div className="metric-icon-wrap" style={{ color: '#c084fc' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#d8b4fe' }}>
            <Link to="/student/interviews">{activeInterviews.length}</Link>
          </div>
          <div className="metric-caption">Awaiting response or confirmed</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Offers / Selected</span>
            <div className="metric-icon-wrap" style={{ color: '#34d399' }}>
              <Award size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#6ee7b7' }}>{selectedCount}</div>
          <div className="metric-caption">Final selection offers</div>
        </div>
      </div>

      {/* Profile Summary & Next Action Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
              Academic Credentials
            </h2>
            <Link to="/student/profile" className="btn btn-secondary btn-sm">
              Manage
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Institution / College</span>
              <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{profile?.college || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Branch / Stream</span>
              <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{profile?.branch || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Batch / Grad Year</span>
              <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{profile?.graduationYear || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resume Status</span>
              <span style={{ fontWeight: '500', color: profile?.resumeUrl ? '#6ee7b7' : '#fca5a5' }}>
                {profile?.resumeUrl ? '✓ PDF Attached' : 'Missing Resume'}
              </span>
            </div>
            <div style={{ paddingTop: '0.3rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Top Skills</span>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="tags">
                  {profile.skills.slice(0, 6).map((s, idx) => (
                    <span key={idx} className="tag">{s}</span>
                  ))}
                  {profile.skills.length > 6 && (
                    <span className="tag" style={{ color: 'var(--text-dim)' }}>+{profile.skills.length - 6}</span>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>No skills declared yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick CTA Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(180deg, #131a29 0%, #161f33 100%)' }}>
          <div>
            <div className="badge badge-proposed" style={{ marginBottom: '0.75rem', width: 'fit-content' }}>
              Campus Drives Active
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: '1.3' }}>
              Discover Top Campus Recruiters
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              View upcoming placement opportunities matching your branch criteria. Submit applications early before deadlines close.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/jobs" className="btn btn-primary btn-sm">
              Browse Openings <ArrowRight size={14} />
            </Link>
            <Link to="/student/applications" className="btn btn-secondary btn-sm">
              My Applications
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
            Recent Applications
          </h2>
          <Link to="/student/applications" style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            View all ({applications.length}) <ArrowRight size={13} />
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state" style={{ margin: '1.5rem', background: 'transparent' }}>
            <Clock className="empty-state-icon" />
            <h3>No applications submitted</h3>
            <p>You have not applied to any job postings yet. Explore available campus drives to get started.</p>
            <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              <Briefcase size={13} /> Browse Open Positions
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title & Organization</th>
                  <th>Location</th>
                  <th>Applied On</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app) => (
                  <tr key={app._id}>
                    <td>
                      {app.jobId ? (
                        <>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{app.jobId.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.jobId.companyName}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Job posting deleted</span>
                      )}
                    </td>
                    <td>{app.jobId?.location || '—'}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {app.jobId && (
                        <Link to={`/jobs/${app.jobId._id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                          Details
                        </Link>
                      )}
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

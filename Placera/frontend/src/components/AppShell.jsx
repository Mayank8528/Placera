import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  User,
  PlusCircle,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const AppShell = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Public/Guest Layout
  if (!isAuthenticated || isAuthPage) {
    return (
      <div className="app-container">
        <header className="public-header">
          <div className="public-nav-container">
            <Link to="/" className="brand-name" style={{ fontSize: '1.2rem' }}>
              <span className="brand-icon">P</span>
              <span>Placera</span>
              <span className="brand-badge">Campus</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isAuthPage ? (
                location.pathname === '/login' ? (
                  <Link to="/register" className="btn btn-secondary btn-sm">
                    Register
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    Sign In
                  </Link>
                )
              ) : (
                <>
                  <Link to="/login" className="btn btn-secondary btn-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="public-content">{children}</main>
      </div>
    );
  }

  // Navigation Items according to User Role
  const renderNavLinks = () => {
    if (user?.role === 'student') {
      return (
        <>
          <div className="sidebar-nav-section-title">Navigation</div>
          <NavLink
            to="/student/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Briefcase />
            <span>Explore Jobs</span>
          </NavLink>
          <NavLink
            to="/student/applications"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ChecklistIcon />
            <span>My Applications</span>
          </NavLink>
          <NavLink
            to="/student/interviews"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Calendar />
            <span>My Interviews</span>
          </NavLink>

          <div className="sidebar-nav-section-title" style={{ marginTop: '0.75rem' }}>Account</div>
          <NavLink
            to="/student/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <User />
            <span>Student Profile</span>
          </NavLink>
        </>
      );
    }

    if (user?.role === 'recruiter') {
      return (
        <>
          <div className="sidebar-nav-section-title">Hiring Workspace</div>
          <NavLink
            to="/recruiter/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard />
            <span>Overview</span>
          </NavLink>
          <NavLink
            to="/recruiter/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Briefcase />
            <span>Job Postings</span>
          </NavLink>
          <NavLink
            to="/recruiter/interviews"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Calendar />
            <span>Interviews</span>
          </NavLink>
          <NavLink
            to="/recruiter/jobs/create"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <PlusCircle />
            <span>Post New Drive</span>
          </NavLink>
        </>
      );
    }

    if (user?.role === 'admin') {
      return (
        <>
          <div className="sidebar-nav-section-title">Administration</div>
          <NavLink
            to="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Shield />
            <span>Admin Console</span>
          </NavLink>
          <NavLink
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Briefcase />
            <span>All Job Drives</span>
          </NavLink>
        </>
      );
    }

    return null;
  };

  const userInitials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Persistent Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand-name">
            <span className="brand-icon">P</span>
            <span>Placera</span>
          </Link>
          <span className="brand-badge" style={{ marginLeft: 'auto' }}>
            {user?.role}
          </span>
        </div>

        <nav className="sidebar-nav">{renderNavLinks()}</nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-tertiary btn-sm"
            style={{ padding: '0.35rem', color: 'var(--text-dim)' }}
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-tertiary btn-sm"
              style={{ display: 'none' }}
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Campus Placement Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />
            <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: '#fff',
                }}
              >
                {userInitials}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </div>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

// Helper small icon
const ChecklistIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 11 3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export default AppShell;

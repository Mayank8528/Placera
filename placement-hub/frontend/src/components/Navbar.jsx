import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-logo">P</span>
          <span>Placera</span>
        </Link>

        <nav>
          <ul className="nav-links">
            {/* Show Explore Jobs only to logged in students or admins */}
            {isAuthenticated && (user?.role === 'student' || user?.role === 'admin') && (
              <li>
                <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Explore Jobs
                </NavLink>
              </li>
            )}

            {/* Student Links */}
            {isAuthenticated && user?.role === 'student' && (
              <>
                <li>
                  <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/student/applications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    My Applications
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/student/interviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    My Interviews
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/student/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    My Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* Recruiter Links */}
            {isAuthenticated && user?.role === 'recruiter' && (
              <>
                <li>
                  <NavLink to="/recruiter/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/recruiter/jobs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    My Postings
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/recruiter/interviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Interviews
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/recruiter/jobs/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    + Post Job
                  </NavLink>
                </li>
              </>
            )}

            {/* Admin Links */}
            {isAuthenticated && user?.role === 'admin' && (
              <li>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Admin Panel
                </NavLink>
              </li>
            )}

            {/* User Session status & Notifications */}
            {isAuthenticated ? (
              <li className="nav-user">
                <NotificationBell />
                <span className="role-pill">{user?.role}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>
                  {user?.name}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </li>
            ) : (
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

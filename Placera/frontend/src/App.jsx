import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import JobList from './pages/JobList';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import Register from './pages/Register';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentApplications from './pages/StudentApplications';
import StudentInterviews from './pages/StudentInterviews';
import StudentProfile from './pages/StudentProfile';

// Recruiter Pages
import RecruiterDashboard from './pages/RecruiterDashboard';
import RecruiterJobs from './pages/RecruiterJobs';
import RecruiterInterviews from './pages/RecruiterInterviews';
import CreateEditJob from './pages/CreateEditJob';
import JobApplicants from './pages/JobApplicants';

import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AppShell>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Root redirect: default to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes for Authenticated Users (Students & Admins to browse all jobs) */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
        </Route>

        {/* Student Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/interviews" element={<StudentInterviews />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>

        {/* Recruiter Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
          <Route path="/recruiter/jobs/create" element={<CreateEditJob />} />
          <Route path="/recruiter/jobs/:id/edit" element={<CreateEditJob />} />
          <Route path="/recruiter/jobs/:jobId/applicants" element={<JobApplicants />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;

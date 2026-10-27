import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Trash2,
  ExternalLink,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import api from '../services/api';

const StudentProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
    branch: '',
    graduationYear: '',
    phone: '',
    skills: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [resumeData, setResumeData] = useState({
    url: '',
    filename: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeMsg, setResumeMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/students/profile');
        const p = res.data.profile;
        setFormData({
          name: p.name || '',
          email: p.email || '',
          college: p.college || '',
          branch: p.branch || '',
          graduationYear: p.graduationYear ? p.graduationYear.toString() : '',
          phone: p.phone || '',
          skills: (p.skills || []).join(', '),
        });
        setResumeData({
          url: p.resumeUrl || '',
          filename: p.resumeFilename || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setResumeMsg({ type: '', text: '' });
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client validations: PDF and 5MB limit
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeMsg({ type: 'error', text: 'Invalid file format. Only PDF files (.pdf) are permitted.' });
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeMsg({ type: 'error', text: 'File size exceeds maximum limit of 5 MB.' });
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setResumeMsg({ type: 'error', text: 'Please select a PDF resume file to upload.' });
      return;
    }

    setUploadingResume(true);
    setResumeMsg({ type: '', text: '' });

    const uploadFormData = new FormData();
    uploadFormData.append('resume', selectedFile);

    try {
      const res = await api.post('/students/resume', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeData({
        url: res.data.resumeUrl,
        filename: res.data.resumeFilename,
      });
      setSelectedFile(null);
      setResumeMsg({ type: 'success', text: 'Resume uploaded successfully!' });
      const fileInput = document.getElementById('resumeFileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setResumeMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload resume. Please check storage configuration.',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeRemove = async () => {
    const confirmed = window.confirm('Are you sure you want to remove your uploaded resume?');
    if (!confirmed) return;

    setUploadingResume(true);
    setResumeMsg({ type: '', text: '' });

    try {
      await api.delete('/students/resume');
      setResumeData({ url: '', filename: '' });
      setSelectedFile(null);
      setResumeMsg({ type: 'success', text: 'Resume removed successfully.' });
      const fileInput = document.getElementById('resumeFileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setResumeMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove resume.',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        college: formData.college,
        branch: formData.branch,
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : null,
        phone: formData.phone,
        skills: formData.skills,
      };

      const res = await api.put('/students/profile', payload);
      setSuccess(res.data.message || 'Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setError(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your academic profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="breadcrumbs">
            <Link to="/student/dashboard">Portal</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Profile</span>
          </div>
          <h1 className="page-title">Student Profile & Credentials</h1>
          <p className="page-subtitle">
            Maintain your academic details and resume for corporate placement evaluation.
          </p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Academic & Personal Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <GraduationCap size={18} style={{ color: 'var(--accent-primary)' }} />
            Academic & Contact Details
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                value={formData.email}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="college">College / Institution</label>
              <input
                id="college"
                name="college"
                type="text"
                placeholder="e.g. National Institute of Technology"
                className="form-input"
                value={formData.college}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="branch">Branch / Major</label>
              <input
                id="branch"
                name="branch"
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                className="form-input"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="graduationYear">Graduation Year</label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="number"
                min="2020"
                max="2035"
                placeholder="e.g. 2026"
                className="form-input"
                value={formData.graduationYear}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. +91 9876543210"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skills">
              Key Skills & Technologies (comma-separated)
            </label>
            <input
              id="skills"
              name="skills"
              type="text"
              placeholder="e.g. React, Node.js, Python, SQL, Docker, AWS"
              className="form-input"
              value={formData.skills}
              onChange={handleChange}
            />
            <span className="form-hint">
              These skills help recruiters filter candidate pools for relevant drives.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Resume Document Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
            Attached Resume (PDF)
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Attach your latest resume for corporate recruiters to review during campus drive shortlisting.
        </p>

        {resumeMsg.text && (
          <div className={`alert ${resumeMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {resumeMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{resumeMsg.text}</span>
          </div>
        )}

        {/* Current File Banner */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
              Current Document
            </span>
            {resumeData.url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={18} style={{ color: '#6ee7b7' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>
                  {resumeData.filename || 'Student_Resume.pdf'}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                No resume file attached yet
              </span>
            )}
          </div>

          {resumeData.url && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const profileRes = await api.get('/students/profile');
                    const userId = profileRes.data.profile?.userId;
                    const res = await api.get(`/students/${userId}/resume`);
                    if (res.data.resumeUrl) {
                      window.open(res.data.resumeUrl, '_blank', 'noopener,noreferrer');
                    }
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to open resume.');
                  }
                }}
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={13} /> View PDF
              </button>
              <button
                type="button"
                onClick={handleResumeRemove}
                disabled={uploadingResume}
                className="btn btn-danger btn-sm"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleResumeUpload}>
          <div className="form-group">
            <label className="form-label" htmlFor="resumeFileInput">
              {resumeData.url ? 'Replace Document (PDF only, max 5 MB)' : 'Upload Document (PDF only, max 5 MB)'}
            </label>
            <input
              id="resumeFileInput"
              type="file"
              accept=".pdf,application/pdf"
              className="form-input"
              onChange={handleFileChange}
              disabled={uploadingResume}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!selectedFile || uploadingResume}
            >
              <UploadCloud size={14} />
              {uploadingResume ? 'Uploading...' : resumeData.url ? 'Replace Resume' : 'Upload Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;

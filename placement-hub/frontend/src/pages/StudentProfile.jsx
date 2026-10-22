import React, { useState, useEffect } from 'react';
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

    // Client-side validations: File type and 5MB limit
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
      // Reset file input element
      const fileInput = document.getElementById('resumeFileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setResumeMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload resume. Please check cloud storage credentials.',
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Academic & Personal Details Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.4rem' }}>
          Student Academic Profile
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Keep your academic and contact details up-to-date so recruiters can evaluate your background.
        </p>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                value={formData.email}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="college">College / University</label>
              <input
                id="college"
                name="college"
                type="text"
                placeholder="e.g. State Institute of Technology"
                className="form-input"
                value={formData.college}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="branch">Branch / Specialization</label>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              Key Skills (comma-separated)
            </label>
            <input
              id="skills"
              name="skills"
              type="text"
              placeholder="e.g. React, Node.js, Python, SQL, Git, Docker"
              className="form-input"
              value={formData.skills}
              onChange={handleChange}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              Separate skills by commas to turn them into filterable tags.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={saving}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

      {/* 2. Resume Upload Section */}
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          📄 Resume Document
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Upload your latest resume in PDF format (maximum size 5 MB). Recruiters will review this document when you apply to campus drives.
        </p>

        {resumeMsg.text && (
          <div className={`alert ${resumeMsg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {resumeMsg.text}
          </div>
        )}

        {/* Current Resume status preview */}
        <div style={{
          padding: '1.25rem',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
              Current Uploaded File
            </span>
            {resumeData.url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📎</span>
                <strong style={{ color: '#60a5fa', wordBreak: 'break-all' }}>
                  {resumeData.filename || 'Student_Resume.pdf'}
                </strong>
              </div>
            ) : (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Resume not uploaded
              </span>
            )}
          </div>

          {resumeData.url && (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
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
                View / Download PDF
              </button>
              <button
                type="button"
                onClick={handleResumeRemove}
                disabled={uploadingResume}
                className="btn btn-danger btn-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Upload / Replace Form */}
        <form onSubmit={handleResumeUpload}>
          <div className="form-group">
            <label className="form-label" htmlFor="resumeFileInput">
              {resumeData.url ? 'Replace Existing Resume (PDF)' : 'Upload New Resume (PDF)'}
            </label>
            <input
              id="resumeFileInput"
              type="file"
              accept=".pdf,application/pdf"
              className="form-input"
              onChange={handleFileChange}
              disabled={uploadingResume}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
              Only PDF format is accepted. Maximum file size: 5 MB.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedFile || uploadingResume}
            style={{ marginTop: '0.5rem' }}
          >
            {uploadingResume ? 'Uploading Document...' : resumeData.url ? 'Replace Resume' : 'Upload Resume'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;

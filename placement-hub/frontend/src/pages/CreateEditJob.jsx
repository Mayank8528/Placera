import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';

const CreateEditJob = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    description: '',
    location: '',
    salary: '',
    requiredSkills: '',
    deadline: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      const fetchJob = async () => {
        try {
          const res = await api.get(`/jobs/${id}`);
          const j = res.data.job;
          setFormData({
            title: j.title || '',
            companyName: j.companyName || '',
            description: j.description || '',
            location: j.location || '',
            salary: j.salary || '',
            requiredSkills: (j.requiredSkills || []).join(', '),
            deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : '',
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch job details');
        } finally {
          setLoading(false);
        }
      };

      fetchJob();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        companyName: formData.companyName,
        description: formData.description,
        location: formData.location,
        salary: formData.salary,
        requiredSkills: formData.requiredSkills,
        deadline: formData.deadline,
      };

      if (isEditMode) {
        await api.put(`/jobs/${id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }

      navigate('/recruiter/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job posting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading job form...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <Link to="/recruiter/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        &larr; Back to My Postings
      </Link>

      <div className="card">
        <h2 style={{ fontSize: '1.7rem', fontWeight: '800', marginBottom: '0.3rem' }}>
          {isEditMode ? 'Edit Job Posting' : 'Create New Campus Drive'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Provide the role requirements and application parameters for interested students.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Job Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Associate Software Engineer"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="companyName">Company Name</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="e.g. Acme Cloud Corp"
                className="form-input"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g. Bengaluru / Hybrid / Remote"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="salary">Salary / Package (CTC)</label>
              <input
                id="salary"
                name="salary"
                type="text"
                required
                placeholder="e.g. 8.5 LPA or 40,000/month"
                className="form-input"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Application Deadline</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                required
                className="form-input"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="requiredSkills">Required Skills (comma-separated)</label>
              <input
                id="requiredSkills"
                name="requiredSkills"
                type="text"
                placeholder="e.g. JavaScript, React, Node.js, DSA"
                className="form-input"
                value={formData.requiredSkills}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Job Description & Responsibilities</label>
            <textarea
              id="description"
              name="description"
              required
              className="form-textarea"
              placeholder="Outline the responsibilities, eligibility criteria, interview rounds, etc."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Posting' : 'Publish Job Listing'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/recruiter/jobs')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditJob;

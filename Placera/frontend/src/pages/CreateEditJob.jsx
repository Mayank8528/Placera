import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Briefcase, ArrowLeft, Building, MapPin, Banknote, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
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
        <p>Loading position form...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="breadcrumbs" style={{ marginBottom: '1.25rem' }}>
        <Link to="/recruiter/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={13} /> Back to My Postings
        </Link>
        <span className="breadcrumbs-separator">/</span>
        <span style={{ color: 'var(--text-main)' }}>{isEditMode ? 'Edit Opening' : 'New Opening'}</span>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              {isEditMode ? 'Edit Campus Drive' : 'Publish New Campus Drive'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Define the requirements, compensation package, and application deadline.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
              <label className="form-label" htmlFor="companyName">Company / Organization</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="e.g. Cisco Systems India"
                className="form-input"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Work Location</label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g. Bengaluru, Karnataka (Hybrid)"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="salary">Compensation / Package (CTC)</label>
              <input
                id="salary"
                name="salary"
                type="text"
                required
                placeholder="e.g. 12.0 LPA or ₹50,000/month"
                className="form-input"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
                placeholder="e.g. React, Node.js, DSA, System Design"
                className="form-input"
                value={formData.requiredSkills}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Job Description & Eligibility Criteria</label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              className="form-textarea"
              placeholder="Outline role responsibilities, eligibility CGPA/branches, selection phases, and expectations..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/recruiter/jobs')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Posting' : 'Publish Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditJob;

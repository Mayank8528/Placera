import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Banknote, Briefcase, Calendar, Sparkles, Filter } from 'lucide-react';
import api from '../services/api';
import JobCard from '../components/JobCard';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs');
        setJobs(res.data.jobs || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch job postings');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = job.title?.toLowerCase().includes(query);
    const companyMatch = job.companyName?.toLowerCase().includes(query);
    const locationMatch = job.location?.toLowerCase().includes(query);
    const skillsMatch = (job.requiredSkills || []).some((s) => s.toLowerCase().includes(query));

    return titleMatch || companyMatch || locationMatch || skillsMatch;
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="breadcrumbs">
            <Link to="/student/dashboard">Portal</Link>
            <span className="breadcrumbs-separator">/</span>
            <span style={{ color: 'var(--text-main)' }}>Campus Drives</span>
          </div>
          <h1 className="page-title">Explore Placement Drives & Opportunities</h1>
          <p className="page-subtitle">
            Browse through active corporate recruitment drives, internships, and associate programs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="input-with-icon" style={{ flex: '1', minWidth: '240px' }}>
            <Search className="input-icon-left" />
            <input
              type="text"
              className="form-input"
              placeholder="Filter by role, company, skills (e.g. React, Python), or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search job listings"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            <Filter size={14} />
            <span>Showing {filteredJobs.length} of {jobs.length} drives</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available positions...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase className="empty-state-icon" />
          <h3>No recruitment drives found</h3>
          <p>
            {searchQuery
              ? `No openings match "${searchQuery}". Try different search terms or clear the filter.`
              : 'There are currently no active campus job drives posted.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.85rem' }}
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid-cards">
          {filteredJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;

import React, { useState, useEffect } from 'react';
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

  // Basic client-side keyword filtering across title, company, skills, or location
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(query);
    const companyMatch = job.companyName.toLowerCase().includes(query);
    const locationMatch = job.location.toLowerCase().includes(query);
    const skillsMatch = (job.requiredSkills || []).some((s) => s.toLowerCase().includes(query));

    return titleMatch || companyMatch || locationMatch || skillsMatch;
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
          Explore Campus Drives & Jobs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          Discover placement openings, internships, and full-time opportunities from verified hiring partners.
        </p>

        {/* Search Input Filter */}
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search by job title, company, skill (e.g. React, Python), or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading available positions...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-state">
          <h3>No opportunities found</h3>
          <p>{searchQuery ? 'Try adjusting your search keywords.' : 'No active job drives have been posted yet.'}</p>
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

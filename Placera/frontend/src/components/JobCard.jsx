import React from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job, isRecruiterView = false, onEdit, onDelete }) => {
  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            {job.title}
          </h3>
          <p style={{ color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.95rem' }}>
            {job.companyName}
          </p>
        </div>
        {isExpired && (
          <span className="badge badge-rejected" style={{ fontSize: '0.7rem' }}>
            Closed
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.9rem' }}>
        <span>📍 {job.location}</span>
        <span>💰 {job.salary}</span>
      </div>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        flex: 1
      }}>
        {job.description}
      </p>

      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="tags" style={{ marginBottom: '1.25rem' }}>
          {job.requiredSkills.map((skill, idx) => (
            <span key={idx} className="tag">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '1rem',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Deadline: {new Date(job.deadline).toLocaleDateString()}
        </span>

        {isRecruiterView ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-secondary btn-sm">
              Applicants
            </Link>
            <button onClick={() => onEdit(job._id)} className="btn btn-secondary btn-sm">
              Edit
            </button>
            <button onClick={() => onDelete(job._id)} className="btn btn-danger btn-sm">
              Delete
            </button>
          </div>
        ) : (
          <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">
            View Details &rarr;
          </Link>
        )}
      </div>
    </div>
  );
};

export default JobCard;

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Banknote, Calendar, ArrowRight, Users, Edit3, Trash2 } from 'lucide-react';

const JobCard = ({ job, isRecruiterView = false, onEdit, onDelete }) => {
  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.3', marginBottom: '0.2rem' }}>
            {job.title}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.88rem' }}>
            {job.companyName}
          </p>
        </div>
        {isExpired ? (
          <span className="badge badge-rejected" style={{ fontSize: '0.7rem' }}>
            Closed
          </span>
        ) : (
          <span className="badge badge-selected" style={{ fontSize: '0.7rem' }}>
            Active
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.6rem 0 0.85rem 0' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={14} style={{ color: 'var(--text-dim)' }} />
          {job.location}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Banknote size={14} style={{ color: 'var(--text-dim)' }} />
          {job.salary}
        </span>
      </div>

      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.84rem',
        lineHeight: '1.5',
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
          {job.requiredSkills.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="tag">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span className="tag" style={{ color: 'var(--text-dim)' }}>
              +{job.requiredSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.85rem',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar size={13} />
          {new Date(job.deadline).toLocaleDateString()}
        </span>

        {isRecruiterView ? (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-secondary btn-sm" title="View Applicants">
              <Users size={13} /> Applicants
            </Link>
            <button type="button" onClick={() => onEdit(job._id)} className="btn btn-secondary btn-sm" title="Edit Job">
              <Edit3 size={13} />
            </button>
            <button type="button" onClick={() => onDelete(job._id)} className="btn btn-danger btn-sm" title="Delete Job">
              <Trash2 size={13} />
            </button>
          </div>
        ) : (
          <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">
            View Details <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default JobCard;

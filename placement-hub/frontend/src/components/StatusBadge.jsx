import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-applied';

  switch (status) {
    case 'Shortlisted':
      badgeClass = 'badge-shortlisted';
      break;
    case 'Selected':
      badgeClass = 'badge-selected';
      break;
    case 'Rejected':
      badgeClass = 'badge-rejected';
      break;
    default:
      badgeClass = 'badge-applied';
  }

  return <span className={`badge ${badgeClass}`}>{status || 'Applied'}</span>;
};

export default StatusBadge;

import React from 'react';

const StatusBadge = ({ status }) => {
  const norm = status?.toLowerCase() || 'applied';

  let badgeClass = 'badge-applied';

  switch (norm) {
    case 'shortlisted':
      badgeClass = 'badge-shortlisted';
      break;
    case 'selected':
    case 'confirmed':
    case 'completed':
      badgeClass = 'badge-selected';
      break;
    case 'rejected':
    case 'declined':
    case 'cancelled':
      badgeClass = 'badge-rejected';
      break;
    case 'proposed':
      badgeClass = 'badge-proposed';
      break;
    default:
      badgeClass = 'badge-applied';
  }

  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Applied';

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      <span>{displayStatus}</span>
    </span>
  );
};

export default StatusBadge;

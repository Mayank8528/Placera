import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-applied';

  switch (status?.toLowerCase()) {
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

  // Format display text (e.g., capitalize first letter)
  const displayStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Applied';

  return <span className={`badge ${badgeClass}`}>{displayStatus}</span>;
};

export default StatusBadge;

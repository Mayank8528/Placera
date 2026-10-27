const Interview = require('../models/Interview');

/**
 * Active statuses that block a participant's calendar.
 * If an interview is cancelled or declined, it is inactive and does not block time slots.
 */
const ACTIVE_INTERVIEW_STATUSES = ['proposed', 'confirmed'];

/**
 * Checks for interval overlap between [startA, endA) and [startB, endB).
 * In MongoDB query form:
 * startTime < newEnd AND endTime > newStart
 *
 * @param {Object} params
 * @param {string|ObjectId} params.recruiterId
 * @param {string|ObjectId} params.studentId
 * @param {Date} params.startTime
 * @param {Date} params.endTime
 * @param {string|ObjectId} [params.excludeInterviewId] - ID of interview to exclude during rescheduling
 * @returns {Promise<{ hasConflict: boolean, reason?: string, conflictingWith?: string }>}
 */
const checkInterviewConflict = async ({ recruiterId, studentId, startTime, endTime, excludeInterviewId = null }) => {
  const queryBase = {
    status: { $in: ACTIVE_INTERVIEW_STATUSES },
    // Half-open interval [startTime, endTime) intersection:
    // Existing interview starts before new interview ends AND existing interview ends after new interview starts
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeInterviewId) {
    queryBase._id = { $ne: excludeInterviewId };
  }

  // 1. Check Recruiter conflict
  const recruiterConflict = await Interview.findOne({
    ...queryBase,
    recruiterId,
  }).populate('studentId', 'name email');

  if (recruiterConflict) {
    return {
      hasConflict: true,
      conflictingWith: 'recruiter',
      reason: `Recruiter already has an active interview scheduled with candidate ${recruiterConflict.studentId?.name || 'another candidate'
        } between ${new Date(recruiterConflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and ${new Date(recruiterConflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
    };
  }

  // 2. Check Student conflict
  const studentConflict = await Interview.findOne({
    ...queryBase,
    studentId,
  }).populate('jobId', 'title companyName');

  if (studentConflict) {
    return {
      hasConflict: true,
      conflictingWith: 'student',
      reason: `Candidate already has an active interview scheduled for "${studentConflict.jobId?.title || 'another position'
        }" (${studentConflict.jobId?.companyName || 'another recruiter'}) during this time slot.`,
    };
  }

  return { hasConflict: false };
};

module.exports = {
  ACTIVE_INTERVIEW_STATUSES,
  checkInterviewConflict,
};

const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { checkInterviewConflict } = require('../services/conflictService');
const { createNotification } = require('../services/notificationService');

/**
 * Format date nicely for notification strings
 */
const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC', // Keep reference predictable
  });
};

/**
 * @route   POST /api/interviews
 * @desc    Schedule an interview for an eligible shortlisted applicant
 * @access  Private (Recruiter only)
 */
const scheduleInterview = async (req, res, next) => {
  try {
    const { applicationId, startTime, endTime, mode, meetingLink, location, instructions } = req.body;

    // 1. Fetch application and populate Job & Student
    const application = await Application.findById(applicationId).populate('jobId').populate('studentId', 'name email');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // 2. Verify Recruiter owns the Job
    if (!application.jobId || application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only schedule interviews for your own job listings',
      });
    }

    // 3. Verify Candidate is shortlisted
    if (application.status !== 'Shortlisted') {
      return res.status(400).json({
        success: false,
        message: `Interviews can only be scheduled for shortlisted applicants. Current status is '${application.status}'`,
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 4. Server-side conflict check (half-open interval [start, end))
    const conflictResult = await checkInterviewConflict({
      recruiterId: req.user._id,
      studentId: application.studentId._id,
      startTime: start,
      endTime: end,
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: `Scheduling conflict detected: ${conflictResult.reason}`,
        conflictingWith: conflictResult.conflictingWith,
      });
    }

    // 5. Create Interview Record
    const interview = await Interview.create({
      jobId: application.jobId._id,
      applicationId: application._id,
      recruiterId: req.user._id,
      studentId: application.studentId._id,
      startTime: start,
      endTime: end,
      mode,
      meetingLink: mode === 'online' ? (meetingLink || '').trim() : '',
      location: mode === 'in-person' ? (location || '').trim() : '',
      instructions: (instructions || '').trim(),
      status: 'proposed',
    });

    // 6. Notify the Student
    await createNotification({
      recipient: application.studentId._id,
      sender: req.user._id,
      type: 'interview_proposed',
      title: `Interview Proposed: ${application.jobId.title}`,
      message: `${req.user.name} (${application.jobId.companyName}) has proposed an interview for the "${application.jobId.title}" role on ${formatDateTime(start)} UTC. Please review and respond.`,
      relatedInterview: interview._id,
    });

    // Populate for response
    const populatedInterview = await Interview.findById(interview._id)
      .populate('jobId', 'title companyName location')
      .populate('studentId', 'name email')
      .populate('recruiterId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Interview scheduled and proposal sent to the candidate',
      interview: populatedInterview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interviews/my
 * @desc    Get interviews for the logged in user (recruiter or student)
 * @access  Private (Recruiter or Student)
 */
const getMyInterviews = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'recruiter') {
      query.recruiterId = req.user._id;
    } else if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admins can see all if desired, or query filters
      if (req.query.recruiterId) query.recruiterId = req.query.recruiterId;
      if (req.query.studentId) query.studentId = req.query.studentId;
    }

    // Optional status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const interviews = await Interview.find(query)
      .populate('jobId', 'title companyName location salary')
      .populate('studentId', 'name email')
      .populate('recruiterId', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/interviews/:id
 * @desc    Get interview by ID with participant identity check
 * @access  Private
 */
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('jobId', 'title companyName location salary description')
      .populate('studentId', 'name email')
      .populate('recruiterId', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Check participant access: user must be the recruiter, the student, or an admin
    const userIdStr = req.user._id.toString();
    const isParticipant =
      interview.recruiterId._id.toString() === userIdStr ||
      interview.studentId._id.toString() === userIdStr ||
      req.user.role === 'admin';

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this interview',
      });
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/interviews/:id/respond
 * @desc    Student confirms or declines a proposed interview
 * @access  Private (Student only)
 */
const respondToInterview = async (req, res, next) => {
  try {
    const { response } = req.body; // 'confirm' or 'decline'
    const interview = await Interview.findById(req.params.id)
      .populate('jobId', 'title companyName')
      .populate('recruiterId', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Only the student assigned to this interview can respond
    if (interview.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the invited candidate can respond to this interview',
      });
    }

    // Only proposed interviews can be confirmed or declined
    if (interview.status !== 'proposed') {
      return res.status(400).json({
        success: false,
        message: `Cannot respond to an interview with status '${interview.status}'. Only 'proposed' interviews can be confirmed or declined.`,
      });
    }

    // If student is confirming, run a conflict check to ensure they didn't confirm another interview in the same slot
    if (response === 'confirm') {
      const conflictResult = await checkInterviewConflict({
        recruiterId: interview.recruiterId._id,
        studentId: req.user._id,
        startTime: interview.startTime,
        endTime: interview.endTime,
        excludeInterviewId: interview._id,
      });

      if (conflictResult.hasConflict) {
        return res.status(409).json({
          success: false,
          message: `Cannot confirm: You have a conflicting interview: ${conflictResult.reason}`,
        });
      }

      interview.status = 'confirmed';
    } else {
      interview.status = 'declined';
    }

    interview.responseAt = new Date();
    await interview.save();

    // Notify the Recruiter
    const notifType = response === 'confirm' ? 'interview_confirmed' : 'interview_declined';
    const notifTitle = response === 'confirm' ? `Interview Confirmed by Candidate` : `Interview Declined by Candidate`;
    const notifMsg = `${req.user.name} has ${response === 'confirm' ? 'confirmed' : 'declined'} the interview for "${interview.jobId?.title
      }" scheduled on ${formatDateTime(interview.startTime)} UTC.`;

    await createNotification({
      recipient: interview.recruiterId._id,
      sender: req.user._id,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      relatedInterview: interview._id,
    });

    res.status(200).json({
      success: true,
      message: `Interview successfully ${interview.status}`,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/interviews/:id/reschedule
 * @desc    Recruiter reschedules an interview to a new time
 * @access  Private (Recruiter only)
 */
const rescheduleInterview = async (req, res, next) => {
  try {
    const { startTime, endTime, mode, meetingLink, location, instructions } = req.body;

    const interview = await Interview.findById(req.params.id)
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Ownership check: must be the recruiter who scheduled it
    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only reschedule your own interviews',
      });
    }

    // Cannot reschedule completed or cancelled interviews
    if (interview.status === 'cancelled' || interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an interview that is already ${interview.status}.`,
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Conflict check excluding this interview itself
    const conflictResult = await checkInterviewConflict({
      recruiterId: req.user._id,
      studentId: interview.studentId._id,
      startTime: start,
      endTime: end,
      excludeInterviewId: interview._id,
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: `Rescheduling conflict detected: ${conflictResult.reason}`,
        conflictingWith: conflictResult.conflictingWith,
      });
    }

    // Update existing record rather than creating a duplicate
    interview.startTime = start;
    interview.endTime = end;
    if (mode) interview.mode = mode;
    if (meetingLink !== undefined) interview.meetingLink = meetingLink.trim();
    if (location !== undefined) interview.location = location.trim();
    if (instructions !== undefined) interview.instructions = instructions.trim();

    // Reset status back to proposed for student re-confirmation
    interview.status = 'proposed';
    interview.responseAt = null;
    await interview.save();

    // Notify the Student
    await createNotification({
      recipient: interview.studentId._id,
      sender: req.user._id,
      type: 'interview_rescheduled',
      title: `Interview Rescheduled: ${interview.jobId?.title}`,
      message: `${req.user.name} (${interview.jobId?.companyName}) has rescheduled your interview for "${interview.jobId?.title}" to ${formatDateTime(start)} UTC. Please review and respond.`,
      relatedInterview: interview._id,
    });

    res.status(200).json({
      success: true,
      message: 'Interview rescheduled successfully and proposal sent to candidate',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/interviews/:id/cancel
 * @desc    Recruiter cancels an interview with an optional reason
 * @access  Private (Recruiter only)
 */
const cancelInterview = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const interview = await Interview.findById(req.params.id)
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Ownership check
    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only cancel your own interviews',
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Interview is already cancelled',
      });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an interview that has already been marked as completed',
      });
    }

    interview.status = 'cancelled';
    interview.cancellationReason = (cancellationReason || '').trim();
    await interview.save();

    // Notify the Student
    await createNotification({
      recipient: interview.studentId._id,
      sender: req.user._id,
      type: 'interview_cancelled',
      title: `Interview Cancelled: ${interview.jobId?.title}`,
      message: `${req.user.name} (${interview.jobId?.companyName}) has cancelled the scheduled interview for "${interview.jobId?.title}".${interview.cancellationReason ? ` Reason: ${interview.cancellationReason}` : ''
        }`,
      relatedInterview: interview._id,
    });

    res.status(200).json({
      success: true,
      message: 'Interview cancelled successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/interviews/:id/complete
 * @desc    Recruiter marks an interview completed
 * @access  Private (Recruiter only)
 */
const completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    // Ownership check
    if (interview.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only complete your own interviews',
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled interview',
      });
    }

    interview.status = 'completed';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview marked as completed',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleInterview,
  getMyInterviews,
  getInterviewById,
  respondToInterview,
  rescheduleInterview,
  cancelInterview,
  completeInterview,
};

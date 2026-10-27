const mongoose = require('mongoose');

/**
 * Validates whether a given string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
};

/**
 * Middleware to validate MongoDB ObjectId in request params.
 * @param {...string} paramNames - e.g. 'id', 'jobId', 'studentId'
 */
const validateObjectIdParams = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !isValidObjectId(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ID parameter format for '${param}': ${value}`,
        });
      }
    }
    next();
  };
};

/**
 * Validates registration input
 */
const validateRegisterInput = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  if (!role || (role !== 'student' && role !== 'recruiter')) {
    errors.push("Role must be specified as either 'student' or 'recruiter'.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates login input
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates job creation and update input
 */
const validateJobInput = (req, res, next) => {
  const { title, companyName, description, location, salary, deadline } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Job title must be at least 3 characters long.');
  }

  if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
    errors.push('Company name is required.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Job description must be at least 10 characters long.');
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push('Job location is required.');
  }

  if (!salary || typeof salary !== 'string' || !salary.trim()) {
    errors.push('Salary / compensation details are required.');
  }

  if (!deadline) {
    errors.push('Application deadline date is required.');
  } else {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.push('Application deadline must be a valid date.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates student academic profile update
 */
const validateStudentProfileInput = (req, res, next) => {
  const { name, graduationYear, phone } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (graduationYear !== undefined && graduationYear !== null && graduationYear !== '') {
    const yearNum = Number(graduationYear);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      errors.push('Graduation year must be a valid 4-digit year between 2000 and 2100.');
    }
  }

  if (phone !== undefined && phone !== null && phone !== '') {
    const phoneClean = String(phone).trim();
    if (phoneClean.length > 20) {
      errors.push('Phone number cannot exceed 20 characters.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates application status update
 */
const validateApplicationStatusInput = (req, res, next) => {
  const { status } = req.body;
  const allowed = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];

  if (!status || !allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid application status. Allowed values: ${allowed.join(', ')}`,
    });
  }

  next();
};

/**
 * Validates scheduling an interview
 */
const validateScheduleInterviewInput = (req, res, next) => {
  const { applicationId, startTime, endTime, mode, meetingLink, location } = req.body;
  const errors = [];

  if (!applicationId || !isValidObjectId(applicationId)) {
    errors.push('A valid application ID is required.');
  }

  if (!startTime) {
    errors.push('Start time is required.');
  }

  if (!endTime) {
    errors.push('End time is required.');
  }

  if (startTime && endTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime())) {
      errors.push('Start time must be a valid date.');
    }
    if (isNaN(endDate.getTime())) {
      errors.push('End time must be a valid date.');
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate >= endDate) {
        errors.push('End time must be strictly after start time.');
      }
      if (startDate.getTime() < Date.now()) {
        errors.push('Cannot schedule an interview in the past.');
      }
    }
  }

  if (!mode || !['online', 'in-person'].includes(mode)) {
    errors.push("Interview mode must be either 'online' or 'in-person'.");
  } else {
    if (mode === 'online' && meetingLink && typeof meetingLink === 'string' && meetingLink.trim().length > 0) {
      try {
        new URL(meetingLink.trim());
      } catch (e) {
        errors.push('Meeting link must be a valid URL.');
      }
    }
    if (mode === 'in-person' && location && typeof location !== 'string') {
      errors.push('Location must be a string.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates rescheduling an interview
 */
const validateRescheduleInterviewInput = (req, res, next) => {
  const { startTime, endTime, mode, meetingLink } = req.body;
  const errors = [];

  if (!startTime) {
    errors.push('New start time is required.');
  }

  if (!endTime) {
    errors.push('New end time is required.');
  }

  if (startTime && endTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime())) {
      errors.push('Start time must be a valid date.');
    }
    if (isNaN(endDate.getTime())) {
      errors.push('End time must be a valid date.');
    }

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate >= endDate) {
        errors.push('End time must be strictly after start time.');
      }
      if (startDate.getTime() < Date.now()) {
        errors.push('Cannot reschedule an interview in the past.');
      }
    }
  }

  if (mode && !['online', 'in-person'].includes(mode)) {
    errors.push("Interview mode must be either 'online' or 'in-person'.");
  }

  if (mode === 'online' && meetingLink && typeof meetingLink === 'string' && meetingLink.trim().length > 0) {
    try {
      new URL(meetingLink.trim());
    } catch (e) {
      errors.push('Meeting link must be a valid URL.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates student response to interview
 */
const validateInterviewResponseInput = (req, res, next) => {
  const { response } = req.body;
  const allowed = ['confirm', 'decline'];

  if (!response || !allowed.includes(response)) {
    return res.status(400).json({
      success: false,
      message: "Response must be either 'confirm' or 'decline'.",
    });
  }

  next();
};

/**
 * Validates student job application input
 */
const validateApplyJobInput = (req, res, next) => {
  const { jobId } = req.body;
  if (!jobId || !isValidObjectId(jobId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid Job ID is required to apply.',
    });
  }
  next();
};

/**
 * Validates pagination and filter query parameters
 */
const validatePaginationInput = (req, res, next) => {
  const { page, limit } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page parameter must be a positive integer >= 1.');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit parameter must be an integer between 1 and 100.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validates cancellation input
 */
const validateCancelInterviewInput = (req, res, next) => {
  const { cancellationReason } = req.body;
  if (cancellationReason !== undefined && cancellationReason !== null) {
    if (typeof cancellationReason !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason must be a string.',
      });
    }
    if (cancellationReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason cannot exceed 500 characters.',
      });
    }
  }
  next();
};

module.exports = {
  isValidObjectId,
  validateObjectIdParams,
  validateRegisterInput,
  validateLoginInput,
  validateJobInput,
  validateStudentProfileInput,
  validateApplicationStatusInput,
  validateScheduleInterviewInput,
  validateRescheduleInterviewInput,
  validateInterviewResponseInput,
  validateCancelInterviewInput,
  validateApplyJobInput,
  validatePaginationInput,
};


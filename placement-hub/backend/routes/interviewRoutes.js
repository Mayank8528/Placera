const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getMyInterviews,
  getInterviewById,
  respondToInterview,
  rescheduleInterview,
  cancelInterview,
  completeInterview,
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validateObjectIdParams,
  validateScheduleInterviewInput,
  validateRescheduleInterviewInput,
  validateInterviewResponseInput,
  validateCancelInterviewInput,
} = require('../middleware/validationMiddleware');

// Schedule an interview (Recruiter only)
router.post(
  '/',
  protect,
  authorize('recruiter'),
  validateScheduleInterviewInput,
  scheduleInterview
);

// Get interviews for authenticated user (recruiter or student or admin)
router.get('/my', protect, getMyInterviews);

// Get specific interview by ID
router.get('/:id', protect, validateObjectIdParams('id'), getInterviewById);

// Student respond to interview proposal
router.put(
  '/:id/respond',
  protect,
  authorize('student'),
  validateObjectIdParams('id'),
  validateInterviewResponseInput,
  respondToInterview
);

// Recruiter reschedule an interview
router.put(
  '/:id/reschedule',
  protect,
  authorize('recruiter'),
  validateObjectIdParams('id'),
  validateRescheduleInterviewInput,
  rescheduleInterview
);

// Recruiter cancel an interview
router.put(
  '/:id/cancel',
  protect,
  authorize('recruiter'),
  validateObjectIdParams('id'),
  validateCancelInterviewInput,
  cancelInterview
);

// Recruiter mark interview completed
router.put(
  '/:id/complete',
  protect,
  authorize('recruiter'),
  validateObjectIdParams('id'),
  completeInterview
);

module.exports = router;

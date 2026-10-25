const express = require('express');
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyRecruiterJobs,
} = require('../controllers/jobController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const {
  validateJobInput,
  validateObjectIdParams,
} = require('../middleware/validationMiddleware');

// Public route to browse all jobs & view specific job details (optionalAuth identifies recruiter if logged in)
router.get('/', optionalAuth, getAllJobs);
router.get('/recruiter/my', protect, authorize('recruiter'), getMyRecruiterJobs);
router.get('/:id', validateObjectIdParams('id'), optionalAuth, getJobById);

// Recruiter-only job management routes
router.post('/', protect, authorize('recruiter'), validateJobInput, createJob);
router.put('/:id', protect, authorize('recruiter'), validateObjectIdParams('id'), validateJobInput, updateJob);
router.delete('/:id', protect, authorize('recruiter'), validateObjectIdParams('id'), deleteJob);

module.exports = router;

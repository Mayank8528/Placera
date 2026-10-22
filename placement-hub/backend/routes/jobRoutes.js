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

// Public route to browse all jobs & view specific job details (optionalAuth identifies recruiter if logged in)
router.get('/', optionalAuth, getAllJobs);
router.get('/recruiter/my', protect, authorize('recruiter'), getMyRecruiterJobs);
router.get('/:id', optionalAuth, getJobById);

// Recruiter-only job management routes
router.post('/', protect, authorize('recruiter'), createJob);
router.put('/:id', protect, authorize('recruiter'), updateJob);
router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;

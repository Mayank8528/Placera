const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student application endpoints
router.post('/', protect, authorize('student'), applyToJob);
router.get('/my', protect, authorize('student'), getMyApplications);

// Recruiter applicant management endpoints
router.get('/job/:jobId', protect, authorize('recruiter'), getApplicantsForJob);
router.put('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;

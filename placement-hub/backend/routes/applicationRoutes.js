const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validateApplicationStatusInput,
  validateObjectIdParams,
  validateApplyJobInput,
} = require('../middleware/validationMiddleware');

// Student application endpoints
router.post('/', protect, authorize('student'), validateApplyJobInput, applyToJob);
router.get('/my', protect, authorize('student'), getMyApplications);

// Recruiter applicant management endpoints
router.get('/job/:jobId', protect, authorize('recruiter'), validateObjectIdParams('jobId'), getApplicantsForJob);
router.put('/:id/status', protect, authorize('recruiter'), validateObjectIdParams('id'), validateApplicationStatusInput, updateApplicationStatus);

module.exports = router;

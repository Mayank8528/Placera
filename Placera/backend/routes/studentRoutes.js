const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentResume,
  removeStudentResume,
  getStudentResume,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadResume = require('../middleware/uploadMiddleware');
const {
  validateStudentProfileInput,
  validateObjectIdParams,
} = require('../middleware/validationMiddleware');

// Student profile & resume operations (Student role only)
router.get('/profile', protect, authorize('student'), getStudentProfile);
router.put('/profile', protect, authorize('student'), validateStudentProfileInput, updateStudentProfile);
router.post('/resume', protect, authorize('student'), uploadResume.single('resume'), uploadStudentResume);
router.delete('/resume', protect, authorize('student'), removeStudentResume);

// Secure resume access endpoint for authorized parties (Student themselves, Recruiter of their applied job, or Admin)
router.get('/:studentId/resume', protect, validateObjectIdParams('studentId'), getStudentResume);

module.exports = router;

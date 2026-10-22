const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllJobsAdmin,
  deleteJobAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all admin routes with authentication and 'admin' role check
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.get('/jobs', getAllJobsAdmin);
router.delete('/jobs/:id', deleteJobAdmin);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateObjectIdParams,
  validatePaginationInput,
} = require('../middleware/validationMiddleware');

router.get('/', protect, validatePaginationInput, getMyNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, validateObjectIdParams('id'), markAsRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateRegisterInput,
  validateLoginInput,
} = require('../middleware/validationMiddleware');

router.post('/register', validateRegisterInput, register);
router.post('/login', validateLoginInput, login);
router.get('/me', protect, getMe);

module.exports = router;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware:
 * Checks incoming requests for an Authorization: Bearer <token> header.
 * Verifies the JWT and loads the user into req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token missing',
        });
      }

      const secret = process.env.JWT_SECRET || 'fallback_placera_secret_key';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token has expired. Please sign in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or malformed',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided',
    });
  }
};

/**
 * Role-based Authorization Middleware:
 * Restricts access to one or more allowed roles (e.g. authorize('admin', 'recruiter')).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user ? req.user.role : 'guest'}' is not allowed to access this resource`,
      });
    }
    next();
  };
};

/**
 * Optional Authentication Middleware:
 * If an Authorization header is provided, verifies it and sets req.user.
 * If not provided, simply proceeds without failing.
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const secret = process.env.JWT_SECRET || 'fallback_placera_secret_key';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Proceed as unauthenticated for public endpoints
    }
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
};

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
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB (excluding password)
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware] Verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token failure for public routes, proceed as unauthenticated
    }
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
};

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  // Handle Multer Errors (e.g., file size limit)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size exceeds maximum allowed limit of 5 MB.',
      });
    }
    return res.status(400).json({
      message: err.message || 'File upload error',
    });
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      message: `A record with this ${field} already exists.`,
      field,
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      message: messages.join('. '),
      errors: messages,
    });
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Resource not found with id: ${err.value}`,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };

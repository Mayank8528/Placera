const mongoose = require('mongoose');

/**
 * User Schema
 * Represents all authenticated accounts: student, recruiter, or admin.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      // Avoid accidentally including password hash in queries unless explicitly selected
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'recruiter', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      required: [true, 'User role is required'],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);

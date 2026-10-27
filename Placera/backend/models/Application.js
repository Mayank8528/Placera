const mongoose = require('mongoose');

/**
 * Application Schema
 * Represents a student applying for a job.
 */
const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'Applied',
    },
  },
  {
    timestamps: true,
  }
);

// Database-level compound unique index to guarantee no student can apply to the same job twice
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);

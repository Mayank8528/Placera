const mongoose = require('mongoose');

/**
 * Interview Schema
 * Represents an interview scheduled by a recruiter for a shortlisted applicant.
 *
 * Active statuses that block participant calendars: ['proposed', 'confirmed']
 * Inactive statuses that release calendar slots: ['declined', 'cancelled', 'completed']
 */
const interviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application reference is required'],
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter reference is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Interview start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'Interview end time is required'],
    },
    mode: {
      type: String,
      enum: {
        values: ['online', 'in-person'],
        message: '{VALUE} is not a valid interview mode. Allowed: online, in-person',
      },
      required: [true, 'Interview mode is required'],
      default: 'online',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['proposed', 'confirmed', 'declined', 'cancelled', 'completed'],
        message: '{VALUE} is not a valid interview status',
      },
      default: 'proposed',
    },
    responseAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high-frequency queries and conflict checks
interviewSchema.index({ recruiterId: 1, startTime: 1, endTime: 1, status: 1 });
interviewSchema.index({ studentId: 1, startTime: 1, endTime: 1, status: 1 });
interviewSchema.index({ applicationId: 1 });
interviewSchema.index({ jobId: 1 });

module.exports = mongoose.model('Interview', interviewSchema);

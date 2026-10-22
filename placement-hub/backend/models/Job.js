const mongoose = require('mongoose');

/**
 * Job Schema
 * Represents campus recruitment drives/job postings created by recruiters.
 */
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    salary: {
      type: String,
      required: [true, 'Salary/package information is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', jobSchema);

const mongoose = require('mongoose');

/**
 * StudentProfile Schema
 * Extends the User model for students with academic & placement details.
 */
const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per student
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    graduationYear: {
      type: Number,
      min: [2000, 'Graduation year is invalid'],
      max: [2100, 'Graduation year is invalid'],
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    resumeFilename: {
      type: String,
      default: '',
    },
    resumePublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);

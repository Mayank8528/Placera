const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Application = require('../models/Application');
const Job = require('../models/Job');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateDownloadUrl,
} = require('../config/cloudinary');

/**
 * @route   GET /api/students/profile
 * @desc    Get the logged-in student's complete profile
 * @access  Private (Student only)
 */
const getStudentProfile = async (req, res, next) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email role'
    );

    // If profile didn't exist yet, lazily create one
    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user._id,
        college: '',
        branch: '',
        graduationYear: null,
        phone: '',
        skills: [],
      });
      profile = await profile.populate('userId', 'name email role');
    }

    res.status(200).json({
      success: true,
      profile: {
        _id: profile._id,
        userId: profile.userId._id,
        name: profile.userId.name,
        email: profile.userId.email,
        college: profile.college || '',
        branch: profile.branch || '',
        graduationYear: profile.graduationYear,
        phone: profile.phone || '',
        skills: profile.skills || [],
        resumeUrl: profile.resumeUrl || '',
        resumeFilename: profile.resumeFilename || '',
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/students/profile
 * @desc    Update the logged-in student's profile & name
 * @access  Private (Student only)
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const { name, college, branch, graduationYear, phone, skills } = req.body;

    // Optionally update user name if provided
    if (name && name.trim()) {
      await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    }

    // Process skills into array if supplied as string or array
    let processedSkills = [];
    if (Array.isArray(skills)) {
      processedSkills = skills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      processedSkills = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        college: college !== undefined ? college.trim() : undefined,
        branch: branch !== undefined ? branch.trim() : undefined,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        phone: phone !== undefined ? phone.trim() : undefined,
        skills: processedSkills,
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('userId', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        _id: updatedProfile._id,
        userId: updatedProfile.userId._id,
        name: updatedProfile.userId.name,
        email: updatedProfile.userId.email,
        college: updatedProfile.college || '',
        branch: updatedProfile.branch || '',
        graduationYear: updatedProfile.graduationYear,
        phone: updatedProfile.phone || '',
        skills: updatedProfile.skills || [],
        resumeUrl: updatedProfile.resumeUrl || '',
        resumeFilename: updatedProfile.resumeFilename || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/students/resume
 * @desc    Upload or replace PDF resume (Cloudinary)
 * @access  Private (Student only)
 */
const uploadStudentResume = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded. Please select a PDF file.' });
    }

    // Server-side binary check: verify PDF magic bytes '%PDF-' (0x25 0x50 0x44 0x46 0x2D)
    const isMagicPdf = req.file.buffer.length >= 5 && req.file.buffer.toString('utf8', 0, 5) === '%PDF-';
    if (!isMagicPdf) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Uploaded file is not a valid PDF document.',
      });
    }

    let profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await StudentProfile.create({
        userId: req.user._id,
      });
    }

    // If an existing resume exists on Cloudinary, delete it
    if (profile.resumePublicId) {
      await deleteFromCloudinary(profile.resumePublicId);
    }

    // Upload new PDF to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'placementhub_resumes',
      req.file.originalname
    );

    profile.resumeUrl = result.secure_url;
    profile.resumeFilename = req.file.originalname;
    profile.resumePublicId = result.public_id;
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resumeUrl: profile.resumeUrl,
      resumeFilename: profile.resumeFilename,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/students/resume
 * @desc    Remove student's existing resume
 * @access  Private (Student only)
 */
const removeStudentResume = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile || !profile.resumeUrl) {
      return res.status(400).json({ message: 'No resume found to remove' });
    }

    if (profile.resumePublicId) {
      await deleteFromCloudinary(profile.resumePublicId);
    }

    profile.resumeUrl = '';
    profile.resumeFilename = '';
    profile.resumePublicId = '';
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Resume removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/students/:studentId/resume
 * @desc    Securely view/download a student's resume
 *          - Student can view their own resume
 *          - Recruiter can view resume ONLY IF student applied to a job owned by that recruiter
 *          - Admin can view
 * @access  Private (Student, Recruiter, Admin)
 */
const getStudentResume = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const profile = await StudentProfile.findOne({ userId: studentId });
    if (!profile || !profile.resumeUrl) {
      return res.status(404).json({ message: 'Resume not uploaded' });
    }

    // Access control check:
    // 1. If requester is the student themselves -> OK
    if (req.user.role === 'student') {
      if (req.user._id.toString() !== studentId) {
        return res.status(403).json({
          message: 'Forbidden: You cannot access another student\'s resume',
        });
      }
    } else if (req.user.role === 'recruiter') {
      // 2. If recruiter -> check if this student has applied to any job posted by this recruiter
      const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
      const recruiterJobIds = recruiterJobs.map((j) => j._id);

      const hasApplied = await Application.exists({
        studentId,
        jobId: { $in: recruiterJobIds },
      });

      if (!hasApplied) {
        return res.status(403).json({
          message: 'Forbidden: You can only view resumes of candidates who applied to your job postings',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    // Generate signed authenticated download URL from Cloudinary (bypasses ACL / raw delivery restrictions)
    let deliverableUrl = profile.resumeUrl;
    if (profile.resumePublicId) {
      deliverableUrl = generateDownloadUrl(profile.resumePublicId, 'raw') || profile.resumeUrl;
    }

    res.status(200).json({
      success: true,
      resumeUrl: deliverableUrl,
      resumeFilename: profile.resumeFilename,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentResume,
  removeStudentResume,
  getStudentResume,
};

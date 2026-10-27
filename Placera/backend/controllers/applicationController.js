const Application = require('../models/Application');
const Job = require('../models/Job');
const StudentProfile = require('../models/StudentProfile');

/**
 * @route   POST /api/applications
 * @desc    Apply to a job
 * @access  Private (Student only)
 */
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required to apply' });
    }

    // 1. Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 2. Check if deadline has passed
    if (new Date() > new Date(job.deadline)) {
      return res.status(400).json({ message: 'The application deadline for this job has passed' });
    }

    // 3. Prevent duplicate applications (check in code before DB index catches it)
    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this job',
      });
    }

    // 4. Create the application (default status is 'Applied')
    const application = await Application.create({
      studentId: req.user._id,
      jobId,
      status: 'Applied',
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    // If caught by the compound unique index in MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already applied for this job',
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/applications/my
 * @desc    Get all applications submitted by the logged-in student
 * @access  Private (Student only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    View applicants for a specific job
 * @access  Private (Recruiter only - must own the job)
 */
const getApplicantsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Check if the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Recruiter ownership restriction
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You can only view applicants for your own job listings',
      });
    }

    // Fetch applications with student details
    const applications = await Application.find({ jobId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    // Fetch student academic profiles for these applicants
    const studentUserIds = applications.map((app) => app.studentId?._id).filter(Boolean);
    const profiles = await StudentProfile.find({ userId: { $in: studentUserIds } });

    // Map profiles by userId string for fast lookup
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    // Combine application with student academic profile details
    const formattedApplicants = applications.map((app) => {
      const student = app.studentId;
      const profile = student ? profileMap[student._id.toString()] : null;

      return {
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        student: {
          _id: student ? student._id : null,
          name: student ? student.name : 'Unknown',
          email: student ? student.email : 'Unknown',
          college: profile ? profile.college : '',
          branch: profile ? profile.branch : '',
          graduationYear: profile ? profile.graduationYear : null,
          phone: profile ? profile.phone : '',
          skills: profile ? profile.skills : [],
          resumeUrl: profile ? profile.resumeUrl : '',
          resumeFilename: profile ? profile.resumeFilename : '',
        },
      };
    });

    res.status(200).json({
      success: true,
      job: {
        _id: job._id,
        title: job.title,
        companyName: job.companyName,
      },
      count: formattedApplicants.length,
      applicants: formattedApplicants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/applications/:id/status
 * @desc    Update an applicant's status (Applied, Shortlisted, Selected, Rejected)
 * @access  Private (Recruiter only - must own the job)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    // Find the application and populate the job
    const application = await Application.findById(id).populate('jobId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify that the job belongs to the logged-in recruiter
    if (!application.jobId || application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You can only update applications for your own job listings',
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
};

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

/**
 * @route   GET /api/admin/users
 * @desc    View all registered users (excluding password hashes)
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/jobs
 * @desc    View all job listings with recruiter info
 * @access  Private (Admin only)
 */
const getAllJobsAdmin = async (req, res, next) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/jobs/:id
 * @desc    Delete any inappropriate job listing (and cascade clean its applications)
 * @access  Private (Admin only)
 */
const deleteJobAdmin = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job listing and related applications removed by Admin',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllJobsAdmin,
  deleteJobAdmin,
};

const Job = require('../models/Job');
const Application = require('../models/Application');

/**
 * @route   GET /api/jobs
 * @desc    Get all active job listings (Public or Student/Recruiter/Admin)
 * @access  Public / Protected
 */
const getAllJobs = async (req, res, next) => {
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
 * @route   GET /api/jobs/:id
 * @desc    Get single job by ID
 * @access  Public / Protected
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // If caller is authenticated as a recruiter, they can only view details of their own job
    // (Students and public users can view all job details, Admins can view any)
    if (req.user && req.user.role === 'recruiter') {
      const posterId = job.postedBy?._id ? job.postedBy._id.toString() : job.postedBy.toString();
      if (posterId !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Forbidden: You do not have permission to access another recruiter\'s job posting',
        });
      }
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (Recruiter only)
 */
const createJob = async (req, res, next) => {
  try {
    const { title, companyName, description, location, salary, requiredSkills, deadline } = req.body;

    if (!title || !companyName || !description || !location || !salary || !deadline) {
      return res.status(400).json({
        message: 'Please provide all required fields: title, companyName, description, location, salary, deadline',
      });
    }

    let skillsArray = [];
    if (Array.isArray(requiredSkills)) {
      skillsArray = requiredSkills.map((s) => s.trim()).filter(Boolean);
    } else if (typeof requiredSkills === 'string') {
      skillsArray = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const job = await Job.create({
      title: title.trim(),
      companyName: companyName.trim(),
      description: description.trim(),
      location: location.trim(),
      salary: salary.trim(),
      requiredSkills: skillsArray,
      deadline: new Date(deadline),
      postedBy: req.user._id, // Set server-side from JWT token
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update a job posting
 * @access  Private (Recruiter only - must own the job)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Authorization check: Recruiter must own this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You can only edit jobs that you have posted',
      });
    }

    const { title, companyName, description, location, salary, requiredSkills, deadline } = req.body;

    if (title) job.title = title.trim();
    if (companyName) job.companyName = companyName.trim();
    if (description) job.description = description.trim();
    if (location) job.location = location.trim();
    if (salary) job.salary = salary.trim();
    if (deadline) job.deadline = new Date(deadline);

    if (requiredSkills !== undefined) {
      if (Array.isArray(requiredSkills)) {
        job.requiredSkills = requiredSkills.map((s) => s.trim()).filter(Boolean);
      } else if (typeof requiredSkills === 'string') {
        job.requiredSkills = requiredSkills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const updatedJob = await job.save();

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job posting
 * @access  Private (Recruiter only - must own the job)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Recruiter must own this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You can only delete jobs that you have posted',
      });
    }

    // Cascade delete any applications associated with this job
    await Application.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job and associated applications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/jobs/recruiter/my
 * @desc    Get all jobs posted by the currently logged-in recruiter
 * @access  Private (Recruiter only)
 */
const getMyRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyRecruiterJobs,
};

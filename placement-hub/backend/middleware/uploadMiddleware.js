const multer = require('multer');

// Store file in memory as Buffer for upload to Cloudinary (or fallback)
const storage = multer.memoryStorage();

// File filter: accept PDF only
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
  ) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF files are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

module.exports = uploadResume;

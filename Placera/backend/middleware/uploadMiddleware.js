const multer = require('multer');

// Store file in memory as Buffer for upload to Cloudinary (or fallback)
const storage = multer.memoryStorage();

// File filter: accept genuine PDF only (check MIME type and filename extension)
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const hasPdfExt = typeof file.originalname === 'string' && file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime && hasPdfExt) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF documents (.pdf) are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
    files: 1, // Only 1 file per upload
  },
  fileFilter,
});

module.exports = uploadResume;

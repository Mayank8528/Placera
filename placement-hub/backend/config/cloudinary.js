const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer to Cloudinary using a stream.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Destination folder on Cloudinary
 * @param {string} originalName - Original filename
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
const uploadToCloudinary = (buffer, folder = 'placementhub_resumes', originalName = '') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are not configured, throw a clear configuration error
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        access_mode: 'public',
        public_id: `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Generates an authenticated / signed download URL for raw or auto assets
 * @param {string} publicId
 * @param {string} resourceType
 * @returns {string}
 */
const generateDownloadUrl = (publicId, resourceType = 'raw') => {
  if (!publicId) return '';
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: resourceType,
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour valid
  });
};

/**
 * Deletes a file from Cloudinary by public ID.
 * @param {string} publicId
 * @returns {Promise}
 */
const deleteFromCloudinary = async (publicId) => {
  if (
    !publicId ||
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (err) {
    console.error('[Cloudinary] Failed to delete previous resume:', err.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateDownloadUrl,
};

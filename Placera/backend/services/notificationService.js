const Notification = require('../models/Notification');

/**
 * Creates an in-app persistent notification for a user.
 *
 * @param {Object} options
 * @param {ObjectId|string} options.recipient - Target User ID
 * @param {ObjectId|string} [options.sender] - Initiating User ID
 * @param {string} options.type - Notification type enum
 * @param {string} options.title - Short title header
 * @param {string} options.message - Descriptive text
 * @param {ObjectId|string} [options.relatedInterview] - Interview ID
 */
const createNotification = async ({ recipient, sender = null, type, title, message, relatedInterview = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedInterview,
    });
    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};

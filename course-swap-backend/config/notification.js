const Notification = require("../models/Notification");

async function createNotification(ownerEmail, requesterEmail, message) {
  try {
    const notification = new Notification({
      ownerEmail,
      requesterEmail,
      message,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error("Failed to save notification:", err);
    throw err; // Re-throw the error to be handled or logged by the caller
  }
}

module.exports = { createNotification };

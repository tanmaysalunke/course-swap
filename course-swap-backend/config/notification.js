const Notification = require("../models/Notification");

async function createNotification(ownerEmail, requesterEmail, message, match) {
  try {
    const existingNotification = await Notification.findOne({
      ownerEmail,
      requesterEmail,
      message,
      match,
    });

    if (existingNotification) {
      console.log("Notification Already Exists!");
      return existingNotification;
    } else {
      const notification = new Notification({
        ownerEmail,
        requesterEmail,
        message,
        match,
      });
      await notification.save();
      return notification;
    }
  } catch (err) {
    console.error("Failed to save notification:", err);
    throw err; // Re-throw the error to be handled or logged by the caller
  }
}

module.exports = { createNotification };

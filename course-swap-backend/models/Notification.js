const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  ownerEmail: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
notificationSchema.index({ ownerEmail: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;

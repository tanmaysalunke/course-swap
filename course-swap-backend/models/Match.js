// models/Match.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const matchSchema = new Schema({
  requesterEmail: { type: String, required: true },
  wantedCourse: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  ownerEmail: { type: String, required: true },
  ownerCourse: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, default: "active" }, // active, invalidated, completed
  history: [
    {
      event: String,
      timestamp: Date,
      description: String,
    },
  ],
});

module.exports = mongoose.model("Match", matchSchema);

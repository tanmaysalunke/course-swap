// models/Course.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  course: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  instructor: { type: String, required: true },
});

module.exports = mongoose.model("Course", courseSchema);

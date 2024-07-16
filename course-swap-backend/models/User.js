const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Course = require("./Course");

const userSchema = new Schema({
  email: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  haveCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  wantCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
});

module.exports = mongoose.model("User", userSchema);

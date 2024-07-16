const User = require("../models/User");
const Match = require("../models/Match");

async function findMatches(userEmail) {
  const users = await User.find()
    .populate("haveCourses")
    .populate("wantCourses");

  // Map to track which users have which courses
  const courseOwners = new Map();

  // Populate the map with the courses users have
  users.forEach((user) => {
    user.haveCourses.forEach((course) => {
      if (!courseOwners.has(course._id.toString())) {
        courseOwners.set(course._id.toString(), []);
      }
      courseOwners.get(course._id.toString()).push(user);
    });
  });

  // Find matches
  users.forEach(async (user) => {
    user.wantCourses.forEach(async (wantedCourse) => {
      if (courseOwners.has(wantedCourse._id.toString())) {
        courseOwners.get(wantedCourse._id.toString()).forEach(async (owner) => {
          if (owner.uid !== user.uid) {
            const ownerCourseId = owner.haveCourses.find(
              (hc) => hc._id.toString() === wantedCourse._id.toString()
            )._id;

            // Find an existing match, including those that are invalidated
            const existingMatch = await Match.findOne({
              requesterEmail: user.email,
              wantedCourse: wantedCourse._id,
              ownerEmail: owner.email,
              ownerCourse: ownerCourseId,
            });

            if (existingMatch) {
              // Reactivate the invalidated match or update as necessary
              if (existingMatch.status === "invalidated") {
                existingMatch.status = "active"; // Set to active or any other appropriate status
                await existingMatch.save();
                console.log(
                  `Reactivated match between ${user.email} and ${owner.email} for course ${wantedCourse._id}`
                );
              }
            } else {
              // Create a new match if none exists
              const newMatch = new Match({
                requesterEmail: user.email,
                wantedCourse: wantedCourse._id,
                ownerEmail: owner.email,
                ownerCourse: ownerCourseId,
                status: "active", // Assume new matches are active by default
              });

              // Save the new match to the database
              await newMatch.save();
            }
          }
        });
      }
    });
  });
}

module.exports = findMatches;

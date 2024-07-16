const Match = require("../models/Match");

/**
 * Retrieve matches for a specific user.
 * @param {string} userEmail - The email of the user to retrieve matches for.
 * @param {string} matchId - Optional parameter to fetch a specific match by ID.
 * @returns {Promise<Array>} - A promise that resolves to an array of match documents.
 */
async function filterMatches(userEmail = {}, matchId = null) {
  let query = { status: { $ne: "invalidated" } }; // Exclude invalidated matches
  if (userEmail) {
    query.requesterEmail = userEmail;
  }
  if (matchId) {
    query._id = matchId; // Fetch specific match if ID is provided
  }

  const matches = await Match.find(query).populate("wantedCourse ownerCourse");
  return matches;
}

module.exports = filterMatches;

const Token = require("../models/Token");
const { OAuth2Client } = require("google-auth-library");

// Function to update tokens in MongoDB
async function updateTokens(refreshToken, accessToken) {
  try {
    const update = { accessToken, updatedAt: new Date() };
    if (refreshToken) update.refreshToken = refreshToken;

    const result = await Token.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Failed to update tokens in the database:", error);
  }
}

// Function to setup the OAuth2 client
async function setupOAuth2Client() {
  try {
    const tokensData = await Token.findOne();
    if (!tokensData) {
      throw new Error("No tokens found in database.");
    }
    const oauth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: tokensData.refreshToken,
    });

    return oauth2Client;
  } catch (error) {
    console.error("Error setting up OAuth2 client:", error);
    return null;
  }
}

// Function to refresh the access token if necessary
async function refreshAccessToken() {
  try {
    const oauth2Client = await setupOAuth2Client();
    if (!oauth2Client) return null;

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.refresh_token) {
      await updateTokens(credentials.refresh_token, credentials.access_token);
    } else {
      await updateTokens(undefined, credentials.access_token);
    }

    return credentials.access_token;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    if (
      error.response &&
      error.response.data &&
      error.response.data.error === "invalid_grant"
    ) {
      console.error(
        "Refresh token is invalid or expired. User re-authentication required."
      );
      // Optionally trigger an alert or notification for re-authentication
    }
    return null;
  }
}

module.exports = { updateTokens, setupOAuth2Client, refreshAccessToken };

const nodemailer = require("nodemailer");
const { refreshAccessToken } = require("./tokenManager");

async function createTransporter() {
  const accessToken = await refreshAccessToken();
  if (!accessToken) {
    console.error("Failed to create transporter: Access Token is null.");
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "chknxnugget4@gmail.com",
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  return transporter;
}

module.exports = { createTransporter };

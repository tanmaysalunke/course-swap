const nodemailer = require("nodemailer");

async function createTransporter() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "chknxnugget4@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
  });

  return transporter;
}

module.exports = { createTransporter };

const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  refreshToken: { type: String, required: true },
  accessToken: { type: String, required: false },
  updatedAt: { type: Date, default: Date.now },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;

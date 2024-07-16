const admin = require("firebase-admin");
const serviceAccount = require("./config/firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://react-course-swap.firebaseio.com",
});

module.exports = admin;

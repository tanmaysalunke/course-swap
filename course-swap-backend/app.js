require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const Course = require("./models/Course");
const cors = require("cors");
const scrapeCourses = require("./tasks/scrapeCourses");
const User = require("./models/User");
const findMatches = require("./tasks/findMatches");
const filterMatches = require("./tasks/filterMatches");
const admin = require("./firebaseAdmin");
const Match = require("./models/Match");
const { createTransporter } = require("./config/mailer");

// Verify transporter configuration
createTransporter().then((transporter) => {
  transporter.verify((error, success) => {
    if (error) {
      console.error("Transporter verification failed:", error);
    } else {
      console.log("Transporter is ready to send emails");
    }
  });
});

const app = express();

// Creating HTTP server and attaching Socket.io to it
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // The origin where your React app is running
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

// Socket.io configuration
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("requestToConnect", async (data) => {
    console.log("Request to connect received:", data);
    try {
      const matchDetails = await filterMatches(null, data._id); // Adjust function to accept _id

      // Check if matchDetails is an array and has any entries
      if (!matchDetails.length || !matchDetails[0].ownerEmail) {
        console.log(
          "No match details found or owner email is missing:",
          matchDetails
        );
        socket.emit("error", "No valid match details found");
        return; // Stop execution if no valid match details
      }

      const ownerEmail = matchDetails[0].ownerEmail; // Assuming matchDetails is an array and we need the first entry
      console.log("Sending email to:", ownerEmail);

      // Send an email to the ownerEmail in the matchDetails
      const transporter = await createTransporter();
      transporter.sendMail(
        {
          from: "chknxnugget4@gmail.com", // Make sure this email is correct and authorized in your Ethereal account
          to: ownerEmail, // This needs to be a valid email address
          subject: "New Connection Request",
          text: `You have a new connection request from ${matchDetails[0].requesterEmail}. Please log in to respond.`,
          html: `<p>You have a new connection request from <strong>${matchDetails[0].requesterEmail}</strong>. Please <a href="https://yourapp.com/login">log in</a> to respond.</p>`,
        },
        (error, info) => {
          if (error) {
            console.error("Mail could not be sent:", error);
            socket.emit("error", "Failed to send email");
          } else {
            console.log("Message sent: %s", info.messageId);
            socket.emit("matchDetails", matchDetails[0]); // Send successful match details back to the requester
          }
        }
      );
    } catch (error) {
      console.error("Error fetching match details:", error);
      socket.emit("error", "Failed to fetch match details");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const uri = process.env.MONGO_URI;
mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5000ms instead of the default 30000ms
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Optional: Create a new route to check the database connection
app.get("/db-status", (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.send("Connected to MongoDB!");
  } else {
    res.send("Not connected to MongoDB.");
  }
});

// Middleware to authenticate and set user context
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).send("No token provided");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    res.status(403).send("Invalid or expired token");
  }
};

// Example usage in an Express route
app.get("/api/user/data", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
      .populate("haveCourses")
      .populate("wantCourses");
    res.json(user);
  } catch (error) {
    console.error("Failed to retrieve user data:", error);
    res.status(500).send("Error fetching user data");
  }
});

// Schedule tasks to be run on the server.
cron.schedule("0 0 * * *", function () {
  console.log("Running a task every day at midnight");
  scrapeCourses();
});

// Endpoint to get all courses
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).send("Failed to retrieve courses.");
  }
});

// Manual trigger for Scraping
app.get("/trigger-scrape", async (req, res) => {
  try {
    await scrapeCourses();
    res.send("Scraping initiated and data being written to DB.");
  } catch (error) {
    console.error("Error during scraping:", error);
    res.status(500).send("Failed to initiate scraping.");
  }
});

// Receive from React
app.post("/api/match", async (req, res) => {
  const { email, uid, haveCourses, wantCourses } = req.body;
  if (!email || !uid || !haveCourses || !wantCourses) {
    return res.status(400).send("Missing required fields");
  }
  try {
    // Check if the user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Fetch matches that need to be invalidated
      const matchesToInvalidate = await Match.find({
        $or: [
          { requesterEmail: email, wantedCourse: { $nin: wantCourses } },
          { ownerEmail: email, ownerCourse: { $nin: haveCourses } },
        ],
      });

      // Update matches to 'invalidated' and push history
      const promises = matchesToInvalidate.map((match) =>
        Match.updateOne(
          { _id: match._id },
          {
            $set: { status: "invalidated" },
            $push: {
              history: {
                event: "invalidated",
                timestamp: new Date(),
                description:
                  "Match invalidated due to updated user preferences.",
              },
            },
          }
        )
      );
      if (matchesToInvalidate.length > 0) {
        matchesToInvalidate.forEach((match) => {
          io.to(match.requesterId).emit("matchInvalidated", {
            matchId: match._id,
            message:
              "One of your matches has been invalidated due to updated preferences.",
          });
        });
      }

      // Wait for all matches to be updated
      await Promise.all(promises);
      console.log(
        `${promises.length} matches invalidated due to preference update.`
      );

      // Update existing user
      user.haveCourses = haveCourses;
      user.wantCourses = wantCourses;
      await user.save();
      res.send("User updated successfully with new course preferences");
      findMatches();
    } else {
      // Create a new user if doesn't exist
      const newUser = new User({ email, uid, haveCourses, wantCourses });
      await newUser.save();
      res.send("New user created successfully with course preferences");
    }
  } catch (error) {
    console.error("Failed to save or update user:", error);
    res.status(500).send("Error saving user data");
  }
});

// Send Personal Data
app.get("/api/personalcourses", async (req, res) => {
  try {
    const user = await User.find({});
    res.json(user);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    res.status(500).send("Failed to retrieve courses.");
  }
});

// Send Matches found
app.get("/api/matches", authenticate, async (req, res) => {
  try {
    if (!req.user.email) {
      return res
        .status(400)
        .send("Authentication is required to access matches.");
    }
    const matches = await filterMatches(req.user.email);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).send("Failed to fetch matches due to an internal error.");
  }
});

// Listen to the server instance, not the app instance
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

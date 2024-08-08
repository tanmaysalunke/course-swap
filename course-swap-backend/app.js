require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");

const Course = require("./models/Course");
const Notification = require("./models/Notification");
const User = require("./models/User");
const Token = require("./models/Token");

const cors = require("cors");
const scrapeCourses = require("./tasks/scrapeCourses");
const findMatches = require("./tasks/findMatches");
const filterMatches = require("./tasks/filterMatches");
const admin = require("./firebaseAdmin");
const Match = require("./models/Match");
const { createTransporter } = require("./config/mailer");
const { createNotification } = require("./config/notification");

const app = express();

// Creating HTTP server and attaching Socket.io to it
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "ws://frontend:80", // The origin where your React app is running
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(express.json());
app.use(cors());

// Socket.io configuration
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("error", (error) => {
    console.error("WebSocket connection error:", error);
  });

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
          from: "chknxnugget4@gmail.com", // Make sure this email is correct and authorized
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
      // Save notification
      const message = `You have a new connection request from ${matchDetails[0].requesterEmail}.`;
      await createNotification(
        matchDetails[0].ownerEmail,
        matchDetails[0].requesterEmail,
        message,
        matchDetails[0]
      );
    } catch (error) {
      console.error("Error fetching match details or sending email:", error);
      socket.emit("error", "Failed to process connection request");
    }
  });

  // Listener to send notifications on request
  socket.on("requestNotifications", async (ownerEmail) => {
    try {
      console.log("Fetching notifications for:", ownerEmail);
      const notifications = await Notification.find({
        ownerEmail: ownerEmail,
        // read: false,
      })
        .populate({
          path: "match",
          populate: {
            path: "wantedCourse ownerCourse",
            model: "Course",
          },
        })
        .sort({ createdAt: -1 });
      socket.emit("updateNotifications", notifications);
    } catch (error) {
      console.error("Error sending notifications", error);
      socket.emit("notificationError", "Failed to fetch notifications.");
    }
  });

  // Handle Notification accept or reject
  socket.on(
    "notificationAccepted",
    async (notifId, requesterEmail, ownerEmail) => {
      try {
        console.log("Fetching Notification ID: ", notifId);
        const notification = await Notification.findOne({ _id: notifId }).sort({
          createdAt: -1,
        });
        const match = await Match.updateOne(
          { _id: notification.match._id },
          {
            $set: { status: "completed" },
            $push: {
              history: {
                event: "completed",
                timestamp: new Date(),
                description: "Match completed due to acceptance of match.",
              },
            },
          }
        );
        notification.read = true;
        await notification.save();
        // Send an email to the requesterEmail for match accepted
        const transporter = await createTransporter();
        transporter.sendMail(
          {
            from: "chknxnugget4@gmail.com", // Make sure this email is correct and authorized
            to: requesterEmail, // This needs to be a valid email address
            subject: "Connection Request Accepted",
            text: `Your connection request from has been accepted! Here are the contact Details of the Course Owner: ${ownerEmail}.`,
            html: `<p>Your connection request from has been accepted!<br>Here are the contact Details of the Course Owner: <strong>${ownerEmail}</strong>.</p>`,
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
        console.log("updated and saved notif read status", notification.read);
      } catch (error) {
        console.error("Error Accepting notifications", error);
        socket.emit("notificationError", "Failed to accpet notifications.");
      }
    }
  );

  socket.on("notificationRejected", async (notifId2, requesterEmail) => {
    try {
      console.log("Fetching Notification ID: ", notifId2);
      const notification = await Notification.findOne({ _id: notifId2 }).sort({
        createdAt: -1,
      });
      const match = await Match.updateOne(
        { _id: notification.match._id },
        {
          $set: { status: "rejected" },
          $push: {
            history: {
              event: "rejected",
              timestamp: new Date(),
              description: "Match rejected by course owner.",
            },
          },
        }
      );
      notification.read = true;
      await notification.save();
      console.log("Sending email to:", requesterEmail); //deleete this line
      // Send an email to the requesterEmail for match accepted
      const transporter = await createTransporter();
      transporter.sendMail(
        {
          from: "chknxnugget4@gmail.com",
          to: requesterEmail,
          subject: "Connection Request Rejected",
          text: `Unfortunately your course match request from has been rejected.`,
          html: `<p>Unfortunately your course match request from has been rejected.</p>`,
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
      // console.log("Notification for course", notification);
      console.log("updated and saved notif read status", notification.read);
    } catch (error) {
      console.error("Error Accepting notifications", error);
      socket.emit("notificationError", "Failed to accpet notifications.");
    }
  });

  // Emit Top 3 Wanted Courses
  const fetchFeaturedCourses = async (socket) => {
    let featuredCourses = []; // Define outside to access later
    try {
      featuredCourses = await User.aggregate([
        { $unwind: "$wantCourses" }, // Deconstruct the wantCourses array
        { $group: { _id: "$wantCourses", count: { $sum: 1 } } }, // Group by courseId and count occurrences
        { $sort: { count: -1 } }, // Sort by count in descending order
        { $limit: 3 }, // Limit to top 3
        {
          $lookup: {
            // Join with Course collection to get details
            from: "courses", // The collection to join
            localField: "_id", // Field from the input documents
            foreignField: "_id", // Field from the documents of the "from" collection
            as: "courseDetails", // The array field that will contain the joined documents
          },
        },
        { $unwind: "$courseDetails" }, // Unwind the courseDetails if necessary
      ]);
      // Emit the results through the socket only if there are courses
      if (featuredCourses.length) {
        socket.emit("setFeaturedCourses", featuredCourses);
      }
    } catch (err) {
      console.error("Error fetching featured courses:", err);
      socket.emit(
        "errorFetchingCourses",
        "Failed to fetch featured courses due to an error."
      );
    }
  };

  // Example of calling this function in response to a socket event
  socket.on("requestFeaturedCourses", () => fetchFeaturedCourses(socket));

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    const existingToken = await Token.findOne();
    if (!existingToken) {
      const initialTokens = {
        refreshToken: process.env.INIT_REFRESH_TOKEN,
        updatedAt: new Date(),
      };
      const token = new Token(initialTokens);
      await token.save();
    }

    // Example usage of createTransporter
    const transporter = await createTransporter();
    if (transporter) {
      console.log("Email transporter created successfully.");
    } else {
      console.error("Failed to create email transporter.");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
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

// Send Connection Request
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

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL;
const SECRET_KEY = process.env.SECRET_KEY;

if (!MONGO_URL) {
  console.error("Error: MONGO_URL environment variable is not set.");
  process.exit(1);
}

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const User = require("./models/user");
const Event = require("./models/event");
const Club = require("./models/club");
const Student = require("./models/students");
const Review = require("./models/reviews"); // Import your Review model

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: SECRET_KEY || "defaultsecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/clubs", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/club.html"));
});

app.get("/events", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/event.html"));
});

app.get("/signInPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/signInPage.html"));
});

app.get("/registerPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/registerPage.html"));
});

app.get("/clubdetails", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/club-details.html"));
});

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.post("/registerPage", upload.single("photo"), async (req, res) => {
  const { userName, password, password2 } = req.body;

  console.log("Form Data:", req.body);

  if (req.file) {
    console.log("File Uploaded:", req.file);
  }

  if (!userName || !password || !password2) {
    return res.status(400).send("All fields are required!");
  }

  if (password !== password2) {
    return res.status(400).send("Passwords do not match!");
  }

  try {
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      if (existingUser.password) {
        return res.status(400).send("User already exists!");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      existingUser.photo = req.file ? `/uploads/${req.file.filename}` : null;

      await existingUser.save();
      return res.redirect("/signInPage");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        userName,
        password: hashedPassword,
        photo: req.file ? `/uploads/${req.file.filename}` : null,
        id: "1",  // Ensure this matches the new schema structure
        clubs: [],  // Initialize as an empty array
        createdAt: new Date(),  // Ensure createdAt is set to current date/time
      });

      await newUser.save();
      return res.redirect("/signInPage");
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Error registering user!");
  }
});

app.post("/studentSignIn", async (req, res) => {
  const { name, password } = req.body;

  console.log("Form Data:", req.body);

  try {
    const user = await User.findOne({ userName: name });
    if (!user || user.id !== 1) {
      return res.status(400).send("Username or password is incorrect!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Username or password is incorrect!");
    }

    req.session.user = user;
    res.redirect("/studentHome");
  } catch (error) {
    res.status(500).send("Error signing in!");
  }
});

app.post("/adminSignIn", async (req, res) => {
  const { name, password } = req.body;

  console.log("Form Data:", req.body);

  try {
    const user = await User.findOne({ userName: name });
    if (!user || user.id !== 2) {
      return res.status(400).send("Username or password is incorrect!");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Username or password is incorrect!");
    }

    req.session.user = user;
    res.redirect("/adminHome");
  } catch (error) {
    res.status(500).send("Error signing in!");
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  }
});

app.get("/api/clubs", async (req, res) => {
  try {
    const search = req.query.search || '';
    const sort = req.query.sort || 'asc';

    const clubs = await Club.find({
      clubName: { $regex: search, $options: 'i' }
    }).populate('members', 'userName');

    const sortedClubs = clubs.sort((a, b) => {
      if (sort === 'asc') {
        return a.clubName.localeCompare(b.clubName);
      } else {
        return b.clubName.localeCompare(a.clubName);
      }
    });

    // Calculate member count for each club
    const clubsWithMemberCount = sortedClubs.map(club => {
      const memberCount = club.members ? club.members.length : 0;
      return {
        ...club.toObject(),
        memberCount
      };
    });

    res.json(clubsWithMemberCount);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    res.status(500).send("Error fetching clubs");
  }
});

app.get("/api/user", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  const { userName, photo } = req.session.user;
  res.json({ userName, photo });
});

app.get("/studentHome", (req, res) => {
  if (!req.session.user || req.session.user.id !== 1) {
    return res.redirect("/signInPage");
  }
  res.sendFile(path.join(__dirname, "/views/studentHome.html"));
});

app.get("/adminHome", (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {
    return res.redirect("/signInPage");
  }
  res.sendFile(path.join(__dirname, "/views/adminHome.html"));
});

// Fetch club details by ID with members' usernames
app.get("/api/clubs/:id", async (req, res) => {
  try {
    const clubId = req.params.id;
    const club = await Club.findById(clubId).populate('members', 'userName'); // Populate members with their userName

    if (!club) {
      return res.status(404).send("Club not found");
    }

    res.json(club);
  } catch (error) {
    console.error("Error fetching club details:", error);
    res.status(500).send("Error fetching club details");
  }
});

// Update club details
app.put("/api/clubs/:id", async (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {
    return res.status(403).send("Forbidden");
  }

  try {
    const clubId = req.params.id;
    const { clubName, description, category } = req.body;

    const club = await Club.findByIdAndUpdate(
      clubId,
      { clubName, description, category },
      { new: true }
    );

    const memberCount = await Student.countDocuments({ club: club._id });
    res.json({ ...club.toObject(), memberCount });
  } catch (error) {
    console.error("Error updating club details:", error);
    res.status(500).send("Error updating club details");
  }
});

// Reviews endpoint
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send("Error fetching reviews");
  }
});

// Fetch event details by ID (assuming eventID is an integer)
app.get("/api/events/:id", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findOne({ eventID: eventId });
    if (!event) {
      return res.status(404).send("Event not found");
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).send("Error fetching event details");
  }
});

// Update event details
app.put("/api/events/:id", async (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {
    return res.status(403).send("Forbidden");
  }

  try {
    const eventId = parseInt(req.params.id);
    const { eventName, date, time, location, eventDescription } = req.body;

    const event = await Event.findOneAndUpdate(
      { eventID: eventId },
      { eventName, date, time, location, eventDescription },
      { new: true }
    );

    res.json(event);
  } catch (error) {
    console.error("Error updating event details:", error);
    res.status(500).send("Error updating event details");
  }
});

// Delete event
app.delete("/api/events/:id", async (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {
    return res.status(403).send("Forbidden");
  }

  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.findOneAndDelete({ eventID: eventId });

    if (!event) {
      return res.status(404).send("Event not found");
    }

    res.send("Event deleted successfully");
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Error deleting event");
  }
});

// Add event
app.post("/api/events", async (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {
    return res.status(403).send("Forbidden");
  }

  const { eventID, eventName, date, time, location, eventDescription, clubID } = req.body;

  if (!eventID || !eventName || !date || !time || !location || !eventDescription || !clubID) {
    return res.status(400).send("All fields are required");
  }

  try {
    const newEvent = new Event({
      eventID,
      eventName,
      date,
      time,
      location,
      eventDescription,
      clubID
    });

    await newEvent.save();
    console.log("Event added successfully:", newEvent); // Log the saved event
    res.status(201).send("Event added successfully");
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).send("Error adding event");
  }
});

app.get("/signOut", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Error signing out!");
    }
    res.redirect("/home");
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on: ${PORT}`);
});

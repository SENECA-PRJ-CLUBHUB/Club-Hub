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

const reviewSchema = new mongoose.Schema({
  reviewerName: { type: String, required: true },
  rating: { type: Number, required: true },
  reviewText: { type: String, required: true },
  clubName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = require("./models/user");
const Event = require("./models/event");
const Club = require("./models/club");
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;

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

app.get("/clubDetails", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/clubDetails.html"));
});

// File upload setup for user photos
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadUser = multer({ storage: userStorage });

// File upload setup for club photos
const clubStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/clubs/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadClub = multer({ storage: clubStorage });

// Register page route with user photo upload
app.post("/registerPage", uploadUser.single("photo"), async (req, res) => {
  const { userName, password, password2 } = req.body;

  if (!userName || !password || !password2) {
    return res.status(400).send("<script>alert('All fields are required!'); window.location.href='/registerPage';</script>");
  }

  if (password !== password2) {
    return res.status(400).send("<script>alert('Passwords do not match!'); window.location.href='/registerPage';</script>");
  }

  try {
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      if (existingUser.password) {
        return res.status(400).send("<script>alert('User already exists!'); window.location.href='/registerPage';</script>");
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
    res.status(500).send("<script>alert('Error registering user!'); window.location.href='/registerPage';</script>");
  }
});

app.post("/studentSignIn", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ userName: name });
    if (!user || user.id !== 1) {
      return res.status(400).send("<script>alert('Username or password is incorrect!'); window.location.href='/signInPage';</script>");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("<script>alert('Username or password is incorrect!'); window.location.href='/signInPage';</script>");
    }

    req.session.user = user;
    res.redirect("/studentHome");
  } catch (error) {
    res.status(500).send("<script>alert('Error signing in!'); window.location.href='/signInPage';</script>");
  }
});

app.post("/adminSignIn", async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ userName: name });
    if (!user || user.id !== 2) {
      return res.status(400).send("<script>alert('Username or password is incorrect!'); window.location.href='/signInPage';</script>");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("<script>alert('Username or password is incorrect!'); window.location.href='/signInPage';</script>");
    }

    req.session.user = user;
    res.redirect("/adminHome");
  } catch (error) {
    res.status(500).send("<script>alert('Error signing in!'); window.location.href='/signInPage';</script>");
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const search = req.query.search || '';
    const clubFilter = req.query.club || '';
    console.log('API called with search:', search, 'and club:', clubFilter);

    let events = await Event.find().lean();

    if (clubFilter && clubFilter !== '') {
      events = events.filter(event => event.clubID === parseInt(clubFilter));
    }

    if (search) {
      events = events.filter(event => event.eventName.toLowerCase().includes(search.toLowerCase()));
    }

    for (let event of events) {
      const club = await Club.findOne({ clubID: event.clubID });
      event.clubName = club ? club.clubName : 'Unknown';
    }

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

app.get('/api/students/:userName/clubs', async (req, res) => {
  try {
    const userName = req.params.userName;
    const user = await User.findOne({ userName }).populate('clubs');
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user.clubs);
  } catch (error) {
    console.error('Error fetching user clubs:', error);
    res.status(500).send('Error fetching user clubs');
  }
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

// Fetch upcoming events for a specific club
app.get("/api/clubs/:id/events", async (req, res) => {
  try {
    const clubId = req.params.id;
    const events = await Event.find({ clubID: clubId });
    res.json(events);
  } catch (error) {
    console.error("Error fetching club events:", error);
    res.status(500).send("Error fetching club events");
  }
});

// Fetch events based on club name
app.get("/api/events/byClub/:clubName", async (req, res) => {
  try {
    const clubName = req.params.clubName;
    const club = await Club.findOne({ clubName });
    if (!club) {
      return res.status(404).send("Club not found");
    }
    const events = await Event.find({ clubID: club.clubID });
    res.json(events);
  } catch (error) {
    console.error("Error fetching events by club:", error);
    res.status(500).send("Error fetching events by club");
  }
});

// Join a club
app.post("/api/clubs/:id/join", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const clubId = req.params.id;
    const user = await User.findById(req.session.user._id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).send("Club not found");
    }

    // Ensure club members is an array
    if (!club.members) {
      club.members = [];
    }

    if (club.members.includes(user._id)) {
      return res.status(400).send("User already a member of the club");
    }

    club.members.push(user._id);
    user.clubs.push(club._id);

    await club.save();
    await user.save();

    res.send("Joined the club successfully");
  } catch (error) {
    console.error("Error joining club:", error);
    res.status(500).send("Error joining club");
  }
});

// Leave a club
app.post("/api/clubs/:id/leave", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const clubId = req.params.id;
    const user = await User.findById(req.session.user._id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).send("Club not found");
    }

    // Ensure club members is an array
    if (!club.members) {
      club.members = [];
    }

    const memberIndex = club.members.indexOf(user._id);
    if (memberIndex === -1) {
      return res.status(400).send("User is not a member of the club");
    }

    club.members.splice(memberIndex, 1);
    const clubIndex = user.clubs.indexOf(club._id);
    if (clubIndex !== -1) {
      user.clubs.splice(clubIndex, 1);
    }

    await club.save();
    await user.save();

    res.send("Left the club successfully");
  } catch (error) {
    console.error("Error leaving club:", error);
    res.status(500).send("Error leaving club");
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

    res.json(club);
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

// Add club route with club photo upload
app.post("/api/clubs", uploadClub.single('photo'), async (req, res) => {
  if (!req.session.user || req.session.user.id !== 2) {  // Ensure only admin can add a club
    return res.status(403).send("Forbidden: Only admin can add a club.");
  }

  const { clubID, clubName, description, category } = req.body;
  const photo = req.file ? `/clubs/${req.file.filename}` : '/path/to/default-photo.png';  // Ensure the correct path

  console.log('Request Body:', req.body);  // Log the request body for debugging
  console.log('File:', req.file);  // Log the file for debugging

  if (!clubID || !clubName || !description || !category) {
    return res.status(400).send("Error: All fields are required.");
  }

  // Validate length of fields (adjust as necessary)
  if (clubName.length < 3) {
    return res.status(400).send("Error: Club name must be at least 3 characters long.");
  }
  if (description.length < 10) {
    return res.status(400).send("Error: Description must be at least 10 characters long.");
  }
  if (category.length < 3) {
    return res.status(400).send("Error: Category must be at least 3 characters long.");
  }

  try {
    const existingClub = await Club.findOne({ clubID });
    if (existingClub) {
      return res.status(400).send("Error: Club ID must be unique.");
    }

    const newClub = new Club({
      clubID,
      clubName,
      description,
      category,
      photo,
      members: [],  // Initialize with no members
    });

    await newClub.save();
    console.log("Club added successfully:", newClub);  // Log the saved club
    res.status(201).send("Club added successfully.");
  } catch (error) {
    console.error("Error adding club:", error);
    res.status(500).send("Error adding club.");
  }
});

app.post("/registerPage", uploadUser.single("photo"), async (req, res) => {
  const { userName, password, password2 } = req.body;

  if (!userName || !password || !password2) {
    return res.status(400).send("<script>alert('All fields are required!'); window.location.href='/registerPage';</script>");
  }

  if (password !== password2) {
    return res.status(400).send("<script>alert('Passwords do not match!'); window.location.href='/registerPage';</script>");
  }

  try {
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      if (existingUser.password) {
        return res.status(400).send("<script>alert('User already exists!'); window.location.href='/registerPage';</script>");
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
    res.status(500).send("<script>alert('Error registering user!'); window.location.href='/registerPage';</script>");
  }
});


app.post("/api/clubs/:clubID/reviews", async (req, res) => {
  const { rating, comment } = req.body;
  const clubID = req.params.clubID;

  // Check if the user is authenticated
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userName = req.session.user.userName;

  // Validate required fields
  if (!rating || !comment) {
    return res.status(400).json({ message: "Rating and comment are required" });
  }

  try {
    const club = await Club.findOne({ clubID });

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const newReview = new Review({
      reviewerName: userName,
      rating: rating,
      reviewText: comment,
      createdAt: new Date(),
    });

    await newReview.save();
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Error adding review" });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { reviewerName, reviewText, rating, clubName } = req.body;

  const newReview = new Review({
    reviewerName,
    reviewText,
    rating,
    clubName
  });

  try {
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reviews', async (req, res) => {
  const { clubName } = req.query;
  try {
    const reviews = await Review.find({ clubName: clubName });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: error.message });
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

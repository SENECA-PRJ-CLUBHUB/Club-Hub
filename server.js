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

mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require("./models/user");
const Event = require("./models/event");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: SECRET_KEY,
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
        id: 1,
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

app.listen(PORT, () => {
  console.log(`Server listening on: ${PORT}`);
});

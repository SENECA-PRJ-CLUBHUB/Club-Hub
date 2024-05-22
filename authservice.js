const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

// Event schema
const eventSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let User;
let Event;

// Initialize connection
module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection("mongodb://localhost:27017/authdb");

    db.on("error", (err) => {
      reject(err);
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      Event = db.model("events", eventSchema);
      resolve();
    });
  });
};

// Register user
module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

          User.create(userData)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name or Email already taken");
              } else {
                reject(`There was an error creating the user: ${err}`);
              }
            });
        })
        .catch(() => {
          reject("There was an error encrypting the password");
        });
    }
  });
};

// Check user (sign-in)
module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          bcrypt.compare(userData.password, user.password).then((result) => {
            if (result) {
              user.loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });

              User.updateOne(
                { userName: user.userName },
                { $set: { loginHistory: user.loginHistory } }
              )
                .then(() => resolve(user))
                .catch((err) => {
                  reject(`There was an error saving the login history: ${err}`);
                });
            } else {
              reject(`Incorrect Password for user: ${userData.userName}`);
            }
          });
        }
      })
      .catch((err) => {
        reject(`There was an error finding the user: ${err}`);
      });
  });
};

// Create event
module.exports.createEvent = function (eventData) {
  return new Promise((resolve, reject) => {
    Event.create(eventData)
      .then((event) => {
        resolve(event);
      })
      .catch((err) => {
        reject(`There was an error creating the event: ${err}`);
      });
  });
};

// Get events for a user
module.exports.getUserEvents = function (userId) {
  return new Promise((resolve, reject) => {
    Event.find({ userId })
      .then((events) => {
        resolve(events);
      })
      .catch((err) => {
        reject(`There was an error retrieving events: ${err}`);
      });
  });
};

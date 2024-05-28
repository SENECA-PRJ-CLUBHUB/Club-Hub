const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
  photo: {
    type: String,
    required: false,
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
  id: {
    type: Number,
    default: 1, // All users will have an id of 1 by default
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;

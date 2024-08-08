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
    default: 1,
    required: true,
  },
  clubs: [{
    type: Schema.Types.ObjectId,
    ref: 'Club'
  }]
});

const User = mongoose.model("User", userSchema);
module.exports = User;

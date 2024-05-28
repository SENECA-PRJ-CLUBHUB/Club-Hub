// models/event.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  eventID: Number,
  eventName: String,
  date: String,
  time: String,
  location: String,
  eventDescription: String,
  clubID: Number,
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;

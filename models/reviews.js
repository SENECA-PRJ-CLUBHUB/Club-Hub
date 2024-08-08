const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for reviews
const reviewSchema = new Schema({
  reviewerName: String,
  rating: { type: Number, min: 0, max: 10 }, // Ensure rating is between 0 and 10
  reviewText: String,
  clubName: String, // New field added to store the club's name
  createdAt: { type: Date, default: Date.now }
});

// Create a model based on the schema
const Review = mongoose.model("Review", reviewSchema);

// Export the model for use in other files
module.exports = Review;

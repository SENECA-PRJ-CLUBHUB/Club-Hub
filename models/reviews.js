const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for reviews
const reviewSchema = new Schema({
  reviewerName: String,
  rating: Number,
  reviewText: String,
  createdAt: { type: Date, default: Date.now }
});

// Create a model based on the schema
const Review = mongoose.model("Review", reviewSchema);

// Export the model for use in other files
module.exports = Review;

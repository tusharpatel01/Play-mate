const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    match:    { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewer: 1, match: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);

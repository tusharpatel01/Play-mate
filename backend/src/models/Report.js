const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedMatch:  { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    reason: {
      type: String,
      enum: ["spam", "fake", "abusive", "inappropriate", "other"],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);

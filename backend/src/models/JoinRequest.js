const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    match:     { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    player:    { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    message: { type: String, maxlength: 200 },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

joinRequestSchema.index({ match: 1, player: 1 }, { unique: true });
joinRequestSchema.index({ organizer: 1, status: 1 });
joinRequestSchema.index({ player: 1, status: 1 });

module.exports = mongoose.model("JoinRequest", joinRequestSchema);

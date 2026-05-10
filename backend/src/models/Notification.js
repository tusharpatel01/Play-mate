const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "join_request",
        "request_accepted",
        "request_rejected",
        "player_removed",
        "match_reminder",
        "new_nearby_match",
        "new_message",
        "new_review",
        "system",
      ],
      required: true,
    },
    title:        { type: String },
    message:      { type: String, required: true },
    match:        { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    chat:         { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    joinRequest:  { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    isRead:       { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

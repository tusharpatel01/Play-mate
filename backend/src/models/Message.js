const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat:   { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    messageType: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },
    imageUrl: { type: String },
    readBy: [
      {
        user:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);

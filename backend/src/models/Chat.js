const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    type:         { type: String, enum: ["direct", "group"], required: true },
    name:         { type: String }, // for group chats
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    match:        { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    admin:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ match: 1 });

module.exports = mongoose.model("Chat", chatSchema);

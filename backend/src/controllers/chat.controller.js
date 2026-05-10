const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { asyncHandler, AppError } = require("../utils/helpers");

// GET /api/chats — Get all chats for the user, with last message + unread counts
exports.getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "name avatar lastSeen")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name avatar" },
    })
    .populate("match", "title sport date status totalSlots")
    .sort({ updatedAt: -1 })
    .lean();

  // Compute unread count per chat for this user
  const userId = req.user._id;
  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId },
        isDeleted: false,
      });
      return { ...chat, unreadCount };
    })
  );

  res.json({ success: true, data: chatsWithUnread });
});

// GET /api/chats/:id — Get single chat details (used when opening from URL)
exports.getChatById = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id)
    .populate("participants", "name avatar skillLevel lastSeen")
    .populate("match", "title sport date status totalSlots organizer")
    .lean();

  if (!chat) return next(new AppError("Chat not found.", 404));

  const isParticipant = chat.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return next(new AppError("You are not a member of this chat.", 403));
  }

  res.json({ success: true, data: chat });
});

// GET /api/chats/:id/messages — Paginated messages
exports.getMessages = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return next(new AppError("Chat not found.", 404));

  const isParticipant = chat.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return next(new AppError("Not authorised to view this chat.", 403));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    chat: req.params.id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "name avatar");

  // Mark messages as read for this user
  await Message.updateMany(
    {
      chat: req.params.id,
      "readBy.user": { $ne: req.user._id },
      sender: { $ne: req.user._id },
    },
    { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
  );

  res.json({ success: true, data: messages.reverse() });
});

// POST /api/chats/direct — Get or create a 1-on-1 chat
exports.getOrCreateDirectChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  if (userId === req.user._id.toString()) {
    return next(new AppError("Cannot chat with yourself.", 400));
  }

  let chat = await Chat.findOne({
    type: "direct",
    participants: { $all: [req.user._id, userId], $size: 2 },
  })
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name avatar" },
    });

  if (!chat) {
    chat = await Chat.create({
      type: "direct",
      participants: [req.user._id, userId],
    });
    chat = await Chat.findById(chat._id).populate(
      "participants",
      "name avatar"
    );
  }

  res.json({ success: true, data: chat });
});

// DELETE /api/chats/:chatId/messages/:messageId — Delete own message
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return next(new AppError("Message not found.", 404));
  if (message.sender.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorised.", 403));
  }

  message.isDeleted = true;
  message.content = "This message was deleted.";
  await message.save();

  req.io.to(req.params.chatId).emit("message:deleted", {
    messageId: message._id,
    chatId: req.params.chatId,
  });

  res.json({ success: true });
});

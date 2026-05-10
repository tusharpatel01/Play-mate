const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");

// ─── Online users map: userId -> socketId ─────────────────
const onlineUsers = new Map();

const initSocket = (io) => {
  // ─── Auth middleware for socket ───────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    // Broadcast online status
    socket.broadcast.emit("user:online", { userId });
    console.log(`🟢  User ${userId} connected`);

    // ─── Join chat rooms user belongs to ─────────────
    socket.on("join:rooms", (chatIds = []) => {
      chatIds.forEach((chatId) => socket.join(chatId));
    });

    // ─── Send message ─────────────────────────────────
    socket.on("message:send", async (data) => {
      try {
        const { chatId, content, messageType = "text", imageUrl } = data;

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          content,
          messageType,
          imageUrl,
        });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          $inc: { messageCount: 1 },
        });

        const populated = await message.populate("sender", "name avatar");

        // Emit to all room members
        io.to(chatId).emit("message:new", populated);

        // Send notification to offline members
        const chat = await Chat.findById(chatId).populate("participants", "_id");
        const offline = chat.participants
          .map((p) => p._id.toString())
          .filter((id) => id !== userId && !onlineUsers.has(id));

        for (const recipientId of offline) {
          await Notification.create({
            recipient: recipientId,
            sender: userId,
            type: "new_message",
            chat: chatId,
            message: `New message in ${chat.name || "chat"}`,
          });
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── Typing indicator ─────────────────────────────
    socket.on("typing:start", ({ chatId }) => {
      socket.to(chatId).emit("typing:start", { userId, chatId });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:stop", { userId, chatId });
    });

    // ─── Mark messages as read ────────────────────────
    socket.on("messages:read", async ({ chatId }) => {
      await Message.updateMany(
        { chat: chatId, sender: { $ne: userId }, "readBy.user": { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
      socket.to(chatId).emit("messages:read", { chatId, userId });
    });

    // ─── Disconnect ───────────────────────────────────
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user:offline", { userId });
      console.log(`🔴  User ${userId} disconnected`);
    });
  });
};

const getOnlineUsers = () => onlineUsers;

const emitToUser = (io, userId, event, data) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) io.to(socketId).emit(event, data);
};

module.exports = { initSocket, getOnlineUsers, emitToUser };

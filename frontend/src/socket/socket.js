import { io } from "socket.io-client";
import { store } from "../app/store";
import {
  addMessage, setTyping, removeMessage,
} from "../features/chat/chatSlice";
import { fetchChats } from "../features/chat/chatSlice";
import { addNotification } from "../features/notifications/notificationSlice";
import toast from "react-hot-toast";

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io("/", {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
    const chats = store.getState().chat.chats;
    const chatIds = chats.map((c) => c._id);
    if (chatIds.length) socket.emit("join:rooms", chatIds);
  });

  socket.on("disconnect", () => console.log("🔌 Socket disconnected"));

  // ─── Message events ─────────────────────────────
  socket.on("message:new", (message) => {
    const activeChatId = store.getState().chat.activeChatId;
    store.dispatch(addMessage({ chatId: message.chat, message }));
    if (message.chat !== activeChatId) {
      toast(`💬 ${message.sender?.name}: ${message.content?.slice(0, 40) || "image"}`, {
        icon: "💬",
      });
    }
  });

  socket.on("message:deleted", ({ messageId, chatId }) => {
    store.dispatch(removeMessage({ chatId, messageId }));
  });

  // ─── Typing events ──────────────────────────────
  socket.on("typing:start", ({ userId, chatId }) => {
    store.dispatch(setTyping({ chatId, userId, isTyping: true }));
  });
  socket.on("typing:stop", ({ userId, chatId }) => {
    store.dispatch(setTyping({ chatId, userId, isTyping: false }));
  });

  // ─── Notification events ────────────────────────
  socket.on("notification:new", (notification) => {
    store.dispatch(addNotification(notification));
    toast(notification.message, {
      icon: getNotifIcon(notification.type),
      duration: 5000,
    });
  });

  // ─── Match joined: refresh chat list so the new group chat appears ──
  socket.on("match:joined", ({ match }) => {
    store.dispatch(fetchChats());
    toast.success(`You're in! Group chat for "${match.title}" is now open.`, {
      duration: 5000,
    });
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChatRoom = (chatId) => socket?.emit("join:rooms", [chatId]);
export const sendSocketMessage = (chatId, content, messageType = "text", imageUrl) =>
  socket?.emit("message:send", { chatId, content, messageType, imageUrl });
export const emitTypingStart = (chatId) => socket?.emit("typing:start", { chatId });
export const emitTypingStop  = (chatId) => socket?.emit("typing:stop",  { chatId });
export const emitMessagesRead = (chatId) => socket?.emit("messages:read", { chatId });

const getNotifIcon = (type) => ({
  join_request: "🎯",
  request_accepted: "🎉",
  request_rejected: "❌",
  new_message: "💬",
  match_reminder: "⏰",
  new_nearby_match: "📍",
}[type] || "🔔");

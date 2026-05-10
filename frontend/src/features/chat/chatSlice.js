import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// ─── Thunks ───────────────────────────────────────────────
export const fetchChats = createAsyncThunk(
  "chat/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/chats");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// NEW: load a single chat (used when opening from URL or after acceptance)
export const fetchChatById = createAsyncThunk(
  "chat/fetchById",
  async (chatId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chats/${chatId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatId, page = 1 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`, {
        params: { page },
      });
      return { chatId, messages: res.data.data, page };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const getOrCreateDirectChat = createAsyncThunk(
  "chat/direct",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.post("/chats/direct", { userId });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    activeChatId: null,
    messages: {},          // chatId -> messages[]
    loading: false,
    typing: {},            // chatId -> [userId]
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChatId = action.payload;
    },
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) state.messages[chatId] = [];

      // Avoid duplicates (socket can emit + REST may load)
      if (!state.messages[chatId].find((m) => m._id === message._id)) {
        state.messages[chatId].push(message);
      }

      // Update lastMessage on the chat in the list
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) {
        chat.lastMessage = message;
        // bump to top
        state.chats = [chat, ...state.chats.filter((c) => c._id !== chatId)];

        // If chat is not active, increment unread count
        if (state.activeChatId !== chatId) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
      }
    },
    setTyping: (state, action) => {
      const { chatId, userId, isTyping } = action.payload;
      if (!state.typing[chatId]) state.typing[chatId] = [];
      if (isTyping) {
        if (!state.typing[chatId].includes(userId)) {
          state.typing[chatId].push(userId);
        }
      } else {
        state.typing[chatId] = state.typing[chatId].filter((id) => id !== userId);
      }
    },
    markChatRead: (state, action) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (chat) chat.unreadCount = 0;
    },
    removeMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      if (state.messages[chatId]) {
        const msg = state.messages[chatId].find((m) => m._id === messageId);
        if (msg) {
          msg.isDeleted = true;
          msg.content = "This message was deleted.";
        }
      }
    },
    addOrUpdateChat: (state, action) => {
      const newChat = action.payload;
      const idx = state.chats.findIndex((c) => c._id === newChat._id);
      if (idx === -1) {
        state.chats = [newChat, ...state.chats];
      } else {
        state.chats[idx] = { ...state.chats[idx], ...newChat };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.chats = action.payload;
      })
      .addCase(fetchChatById.fulfilled, (state, action) => {
        const chat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === chat._id);
        if (idx === -1) state.chats = [chat, ...state.chats];
        else state.chats[idx] = { ...state.chats[idx], ...chat };
      })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages, page } = action.payload;
        if (page === 1) {
          state.messages[chatId] = messages;
        } else {
          state.messages[chatId] = [
            ...messages,
            ...(state.messages[chatId] || []),
          ];
        }
      })
      .addCase(getOrCreateDirectChat.fulfilled, (state, action) => {
        const exists = state.chats.find((c) => c._id === action.payload._id);
        if (!exists) state.chats.unshift(action.payload);
        state.activeChatId = action.payload._id;
      });
  },
});

export const {
  setActiveChat, addMessage, setTyping,
  markChatRead, removeMessage, addOrUpdateChat,
} = chatSlice.actions;
export default chatSlice.reducer;

// ─── Selectors ────────────────────────────────────────────
export const selectChats = (s) => s.chat.chats;
export const selectActiveChatId = (s) => s.chat.activeChatId;
export const selectMessages = (chatId) => (s) => s.chat.messages[chatId] || [];
export const selectTyping = (chatId) => (s) => s.chat.typing[chatId] || [];
export const selectChatById = (chatId) => (s) =>
  s.chat.chats.find((c) => c._id === chatId);
export const selectTotalUnread = (s) =>
  s.chat.chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

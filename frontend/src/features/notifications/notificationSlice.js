import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchNotifications = createAsyncThunk("notifications/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/notifications");
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchUnreadCount = createAsyncThunk("notifications/unreadCount", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/notifications/unread-count");
    return res.data.count;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markAllRead = createAsyncThunk("notifications/markAllRead", async () => {
  await api.put("/notifications/read-all");
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { list: [], unreadCount: 0 },
  reducers: {
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    },
    markOneRead: (state, action) => {
      const n = state.list.find((n) => n._id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => { state.list = action.payload; })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markAllRead.fulfilled, (state) => {
        state.list.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, markOneRead } = notificationSlice.actions;
export default notificationSlice.reducer;
export const selectNotifications = (s) => s.notifications.list;
export const selectUnreadCount = (s) => s.notifications.unreadCount;

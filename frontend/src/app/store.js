import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import matchReducer from "../features/matches/matchSlice";
import chatReducer from "../features/chat/chatSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matches: matchReducer,
    chat: chatReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

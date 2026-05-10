import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence } from "framer-motion";

import { useAuth, useSocket } from "./hooks";
import { selectIsAuthenticated } from "./features/auth/authSlice";

import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import MatchDetail from "./pages/MatchDetail";
import CreateMatch from "./pages/CreateMatch";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/common/LoadingScreen";

// ─── Route guards ─────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector((s) => s.auth.initialized);
  if (!initialized) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector((s) => s.auth.initialized);
  if (!initialized) return <LoadingScreen />;
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

const AdminRoute = ({ children }) => {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);
  if (!initialized) return <LoadingScreen />;
  return user?.role === "admin" ? children : <Navigate to="/home" replace />;
};

export default function App() {
  useAuth();
  useSocket();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected — inside AppLayout (sidebar + navbar) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/create-match" element={<CreateMatch />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

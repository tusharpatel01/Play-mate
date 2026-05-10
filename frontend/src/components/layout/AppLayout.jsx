import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Home, Search, MessageCircle, User, Plus,
  Settings, LogOut, Trophy, ShieldCheck,
} from "lucide-react";
import { logoutUser, selectCurrentUser } from "../../features/auth/authSlice";
import { selectTotalUnread } from "../../features/chat/chatSlice";
import Avatar from "../common/Avatar";
import NotificationDropdown from "../notifications/NotificationDropdown";
import toast from "react-hot-toast";

const NAV = [
  { to: "/home",          icon: Home,          label: "Home" },
  { to: "/explore",       icon: Search,        label: "Explore" },
  { to: "/chat",          icon: MessageCircle, label: "Messages", badge: "chat" },
  { to: "/profile",       icon: User,          label: "Profile" },
];

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const totalUnread = useSelector(selectTotalUnread);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
    toast.success("Logged out.");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-dark-850">
      {/* ─── Sidebar (desktop) ──────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-dark-900 border-r border-white/[0.07] py-4 px-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 px-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-100">
              PlayMate
            </span>
          </div>
          {/* Notification bell with dropdown */}
          <NotificationDropdown />
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              <div className="relative">
                <Icon size={18} />
                {badge === "chat" && totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}

          <div className="pt-2 border-t border-white/[0.06] mt-2">
            <NavLink
              to="/create-match"
              className="nav-link text-brand-400 hover:text-brand-300 hover:bg-brand-900/30"
            >
              <Plus size={18} />
              New Match
            </NavLink>

            {user?.role === "admin" && (
              <NavLink to="/admin" className="nav-link">
                <ShieldCheck size={18} />
                Admin
              </NavLink>
            )}

            <NavLink to="/profile" className="nav-link">
              <Settings size={18} />
              Settings
            </NavLink>
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-white/[0.07] pt-3 px-1">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile top bar with notification bell ───── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-dark-850/90 backdrop-blur-md border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">PlayMate</span>
        </div>
        <NotificationDropdown />
      </div>

      {/* ─── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ─── Mobile bottom nav ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-white/[0.07] flex justify-around py-2 z-50">
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors text-[10px] ${
                isActive ? "text-brand-400" : "text-slate-500"
              }`
            }
          >
            <div className="relative">
              <Icon size={20} />
              {badge === "chat" && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/create-match"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] ${
              isActive ? "text-brand-400" : "text-brand-500"
            }`
          }
        >
          <Plus size={20} />
          <span>Create</span>
        </NavLink>
      </nav>
    </div>
  );
}

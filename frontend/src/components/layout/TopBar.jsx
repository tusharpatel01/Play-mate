import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bell, Trophy, Search } from "lucide-react";
import { selectUnreadCount } from "../../features/notifications/notificationSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import Avatar from "../common/Avatar";

export default function TopBar({ title, showSearch = false, onSearchClick }) {
  const navigate = useNavigate();
  const unread = useSelector(selectUnreadCount);
  const user = useSelector(selectCurrentUser);

  return (
    <header className="sticky top-0 z-30 bg-dark-850/90 backdrop-blur-md border-b border-white/[0.06] px-4 h-14 flex items-center gap-3 md:hidden">
      {/* Logo / Title */}
      <Link to="/home" className="flex items-center gap-2 flex-1">
        {title ? (
          <span className="font-bold text-slate-100 text-base">{title}</span>
        ) : (
          <>
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy size={14} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">PlayMate</span>
          </>
        )}
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {showSearch && (
          <button onClick={onSearchClick} className="btn-ghost p-2">
            <Search size={18} />
          </button>
        )}

        <button
          onClick={() => navigate("/notifications")}
          className="relative btn-ghost p-2"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/profile")}
          className="ml-1"
        >
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
        </button>
      </div>
    </header>
  );
}

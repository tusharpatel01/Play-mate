import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell, CheckCheck, X,
  CheckCircle, XCircle, MessageCircle, MapPin, Clock, Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchNotifications, markAllRead, markOneRead,
  selectNotifications, selectUnreadCount,
} from "../../features/notifications/notificationSlice";
import api from "../../api/axios";
import Avatar from "../common/Avatar";
import { timeAgo } from "../../utils";

const ICONS = {
  join_request:     { icon: Bell,          color: "text-blue-400",    bg: "bg-blue-900/30" },
  request_accepted: { icon: CheckCircle,   color: "text-green-400",   bg: "bg-green-900/30" },
  request_rejected: { icon: XCircle,       color: "text-red-400",     bg: "bg-red-900/30" },
  player_removed:   { icon: XCircle,       color: "text-red-400",     bg: "bg-red-900/30" },
  new_message:      { icon: MessageCircle, color: "text-purple-400",  bg: "bg-purple-900/30" },
  new_nearby_match: { icon: MapPin,        color: "text-yellow-400",  bg: "bg-yellow-900/30" },
  match_reminder:   { icon: Clock,         color: "text-orange-400",  bg: "bg-orange-900/30" },
  new_review:       { icon: Trophy,        color: "text-brand-400",   bg: "bg-brand-900/30" },
};

export default function NotificationDropdown({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Refresh when opened
  useEffect(() => {
    if (open) dispatch(fetchNotifications());
  }, [open, dispatch]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Handle notification click
  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      await api.put(`/notifications/${notif._id}/read`).catch(() => {});
      dispatch(markOneRead(notif._id));
    }
    setOpen(false);
    if (notif.match) navigate(`/matches/${notif.match._id || notif.match}`);
    else if (notif.chat) navigate(`/chat/${notif.chat._id || notif.chat}`);
  };

  const handleMarkAll = (e) => {
    e.stopPropagation();
    dispatch(markAllRead());
  };

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative">
      {/* Trigger element (bell button) */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="relative btn-ghost p-2"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse-green">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-32px)] card overflow-hidden shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div>
                <h3 className="font-bold text-slate-100">Notifications</h3>
                {unread > 0 && (
                  <p className="text-xs text-slate-500">{unread} unread</p>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Bell size={28} className="text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    You'll see join requests and updates here
                  </p>
                </div>
              ) : (
                recent.map((notif, i) => {
                  const cfg = ICONS[notif.type] || ICONS.join_request;
                  const Icon = cfg.icon;
                  return (
                    <motion.button
                      key={notif._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-colors text-left ${
                        notif.isRead ? "hover:bg-white/[0.03]" : "bg-brand-900/10 hover:bg-brand-900/20"
                      }`}
                    >
                      <div className={`w-8 h-8 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {notif.title && (
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {notif.title}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 line-clamp-2 leading-snug mt-0.5">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {notif.sender && (
                            <Avatar
                              src={notif.sender?.avatar}
                              name={notif.sender?.name}
                              size="xs"
                            />
                          )}
                          <span className="text-[10px] text-slate-600">
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center py-2.5 text-xs text-brand-400 hover:bg-white/5 transition-colors border-t border-white/[0.07] font-medium"
              >
                View all notifications
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

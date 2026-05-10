import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, XCircle, MessageCircle, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { markOneRead } from "../../features/notifications/notificationSlice";
import { timeAgo } from "../../utils";
import Avatar from "../common/Avatar";
import api from "../../api/axios";

const ICONS = {
  join_request:     { icon: Bell,          color: "text-blue-400",   bg: "bg-blue-900/30" },
  request_accepted: { icon: CheckCircle,   color: "text-green-400",  bg: "bg-green-900/30" },
  request_rejected: { icon: XCircle,       color: "text-red-400",    bg: "bg-red-900/30" },
  new_message:      { icon: MessageCircle, color: "text-purple-400", bg: "bg-purple-900/30" },
  new_nearby_match: { icon: MapPin,        color: "text-yellow-400", bg: "bg-yellow-900/30" },
  match_reminder:   { icon: Clock,         color: "text-orange-400", bg: "bg-orange-900/30" },
};

export default function NotificationItem({ notification, index }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { icon: Icon, color, bg } = ICONS[notification.type] || ICONS.join_request;

  const handleClick = async () => {
    if (!notification.isRead) {
      await api.put(`/notifications/${notification._id}/read`).catch(() => {});
      dispatch(markOneRead(notification._id));
    }
    if (notification.match) navigate(`/matches/${notification.match._id || notification.match}`);
    else if (notification.chat) navigate(`/chat/${notification.chat}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all
        ${notification.isRead ? "hover:bg-white/5" : "bg-brand-900/10 border border-brand-900/30 hover:bg-brand-900/20"}`}
    >
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="text-sm font-semibold text-slate-200">{notification.title}</p>
        )}
        <p className="text-sm text-slate-400 leading-snug mt-0.5">{notification.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {notification.sender && (
            <div className="flex items-center gap-1">
              <Avatar src={notification.sender?.avatar} name={notification.sender?.name} size="xs" />
              <span className="text-xs text-slate-500">{notification.sender?.name}</span>
            </div>
          )}
          <span className="text-xs text-slate-600">{timeAgo(notification.createdAt)}</span>
        </div>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-brand-400 rounded-full flex-shrink-0 mt-2 animate-pulse-green" />
      )}
    </motion.div>
  );
}

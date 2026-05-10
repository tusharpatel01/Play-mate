import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchNotifications,
  markAllRead,
  selectNotifications,
} from "../features/notifications/notificationSlice";
import NotificationItem from "../components/notifications/NotificationItem";
import { EmptyState } from "../components/common";
import { Spinner } from "../components/common";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const loading = useSelector((s) => s.notifications.loading);
  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAll = () => dispatch(markAllRead());

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Bell size={22} className="text-brand-400" />
            Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              {unread} unread notification{unread !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-400 transition-colors btn-ghost"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </motion.div>

      {/* List */}
      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll see join requests, match updates, and messages here."
        />
      ) : (
        <div className="space-y-1">
          {/* Unread group */}
          {unread > 0 && (
            <>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1 py-2">
                Unread
              </p>
              {notifications
                .filter((n) => !n.isRead)
                .map((n, i) => (
                  <NotificationItem key={n._id} notification={n} index={i} />
                ))}
              <div className="border-t border-white/[0.06] my-3" />
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-1 py-2">
                Earlier
              </p>
            </>
          )}
          {notifications
            .filter((n) => n.isRead)
            .map((n, i) => (
              <NotificationItem key={n._id} notification={n} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}

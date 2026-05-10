import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, IndianRupee, Star } from "lucide-react";
import { formatMatchDate, getSportEmoji, formatCurrency, truncate } from "../../utils";
import { SportBadge, StatusBadge } from "../common";
import Avatar from "../common/Avatar";

export default function MatchCard({ match, index = 0 }) {
  const spotsLeft = match.totalSlots - (match.participants?.length || 0);
  const isFull = spotsLeft <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link to={`/matches/${match._id}`}>
        <div className="card p-4 hover:border-white/20 hover:bg-[#1a2130] transition-all duration-200 group cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-100 text-sm leading-snug group-hover:text-brand-400 transition-colors line-clamp-2">
                {match.title}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <SportBadge sport={match.sport} />
              <StatusBadge status={match.status} />
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={12} className="text-slate-500 flex-shrink-0" />
              <span className="truncate">{match.location?.address || match.location?.city || "Location TBD"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={12} className="text-slate-500 flex-shrink-0" />
              <span>{formatMatchDate(match.date)} · {match.startTime}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users size={12} className="text-slate-500" />
                {match.participants?.length || 0}/{match.totalSlots}
              </span>
              <span className="flex items-center gap-1">
                <IndianRupee size={12} className="text-slate-500" />
                {formatCurrency(match.entryFee || 0)}
              </span>
              {match.skillRequired && match.skillRequired !== "any" && (
                <span className="capitalize text-slate-500">{match.skillRequired}</span>
              )}
            </div>
          </div>

          {/* Spots bar */}
          <div className="mb-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isFull ? "bg-red-500" : "bg-brand-500"}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((match.participants?.length || 0) / match.totalSlots) * 100)}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={match.organizer?.avatar}
                name={match.organizer?.name}
                size="xs"
              />
              <div>
                <p className="text-xs text-slate-400">{match.organizer?.name}</p>
                {match.organizer?.averageRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star size={9} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] text-slate-500">{match.organizer.averageRating}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {isFull ? (
                <span className="text-xs text-red-400 font-medium">Full · Waitlist</span>
              ) : (
                <span className="text-xs text-brand-400 font-semibold">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

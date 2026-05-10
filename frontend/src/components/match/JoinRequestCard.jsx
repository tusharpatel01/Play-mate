import { useState } from "react";
import { CheckCircle, XCircle, Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Avatar from "../common/Avatar";
import { getSkillColor, timeAgo } from "../../utils";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function JoinRequestCard({ request, onUpdate }) {
  const [loading, setLoading] = useState(null);
  const { player } = request;

  const handle = async (action) => {
    setLoading(action);
    try {
      await api.put(`/join-requests/${request._id}/${action}`);
      toast.success(action === "accept" ? "Request accepted! 🎉" : "Request rejected.");
      onUpdate?.(request._id, action);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="card p-4"
    >
      <div className="flex items-start gap-3">
        <Avatar src={player?.avatar} name={player?.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-100 text-sm">{player?.name}</span>
            <span className={`text-xs font-medium capitalize ${getSkillColor(player?.skillLevel)}`}>
              {player?.skillLevel}
            </span>
            {player?.averageRating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-slate-400">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                {player.averageRating}
              </span>
            )}
          </div>
          {player?.bio && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{player.bio}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span>{player?.matchesPlayed || 0} matches played</span>
            <span>•</span>
            <span>{timeAgo(request.createdAt)}</span>
          </div>
          {request.message && (
            <p className="text-xs text-slate-400 mt-2 bg-white/5 rounded-lg p-2 italic">
              "{request.message}"
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 justify-end">
        <button
          onClick={() => handle("reject")}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <XCircle size={14} />
          {loading === "reject" ? "..." : "Decline"}
        </button>
        <button
          onClick={() => handle("accept")}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-50"
        >
          <CheckCircle size={14} />
          {loading === "accept" ? "..." : "Accept"}
        </button>
      </div>
    </motion.div>
  );
}

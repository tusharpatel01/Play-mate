import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MapPin, MessageCircle } from "lucide-react";
import Avatar from "../common/Avatar";
import { getSkillColor, getSportEmoji } from "../../utils";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PlayerCard({ player, index = 0 }) {
  const navigate = useNavigate();

  const handleMessage = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/chats/direct", { userId: player._id });
      navigate(`/chat/${data.data._id}`);
    } catch {
      toast.error("Failed to open chat");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Link to={`/profile/${player._id}`}>
        <div className="card p-4 hover:border-white/20 hover:bg-[#1a2130] transition-all duration-200 group cursor-pointer">
          <div className="flex items-start gap-3">
            <Avatar src={player.avatar} name={player.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-brand-400 transition-colors truncate">
                  {player.name}
                </h3>
                {player.averageRating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-slate-400 flex-shrink-0">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    {player.averageRating}
                  </span>
                )}
              </div>

              <span className={`text-xs font-medium capitalize ${getSkillColor(player.skillLevel)}`}>
                {player.skillLevel}
              </span>

              {player.location?.city && (
                <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin size={11} /> {player.location.city}
                </p>
              )}

              {player.preferredSports?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {player.preferredSports.map((s) => (
                    <span key={s} className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-slate-400">
                      {getSportEmoji(s)} {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
            <span className="text-xs text-slate-500">
              {player.matchesPlayed || 0} matches played
            </span>
            <button
              onClick={handleMessage}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-900/40 text-brand-400 hover:bg-brand-900/70 transition-colors border border-brand-800/50"
            >
              <MessageCircle size={12} /> Message
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

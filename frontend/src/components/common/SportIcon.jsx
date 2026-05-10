// ─── SportIcon.jsx ────────────────────────────────────────
// Maps sport names to emoji + color config

export const SPORT_CONFIG = {
  cricket: {
    emoji: "🏏",
    label: "Cricket",
    badgeClass: "badge-cricket",
    bgClass: "bg-green-900/30",
    textClass: "text-green-400",
    borderClass: "border-green-800/50",
  },
  football: {
    emoji: "⚽",
    label: "Football",
    badgeClass: "badge-football",
    bgClass: "bg-blue-900/30",
    textClass: "text-blue-400",
    borderClass: "border-blue-800/50",
  },
  basketball: {
    emoji: "🏀",
    label: "Basketball",
    badgeClass: "badge-basketball",
    bgClass: "bg-orange-900/30",
    textClass: "text-orange-400",
    borderClass: "border-orange-800/50",
  },
  badminton: {
    emoji: "🏸",
    label: "Badminton",
    badgeClass: "badge-badminton",
    bgClass: "bg-purple-900/30",
    textClass: "text-purple-400",
    borderClass: "border-purple-800/50",
  },
  volleyball: {
    emoji: "🏐",
    label: "Volleyball",
    badgeClass: "badge-volleyball",
    bgClass: "bg-yellow-900/30",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-800/50",
  },
  tennis: {
    emoji: "🎾",
    label: "Tennis",
    badgeClass: "badge-tennis",
    bgClass: "bg-pink-900/30",
    textClass: "text-pink-400",
    borderClass: "border-pink-800/50",
  },
  other: {
    emoji: "🎯",
    label: "Other",
    badgeClass: "bg-slate-700/60 text-slate-400",
    bgClass: "bg-slate-800/30",
    textClass: "text-slate-400",
    borderClass: "border-slate-700/50",
  },
};

export default function SportIcon({ sport, size = "md", showLabel = false }) {
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.other;
  const sizes = { sm: "w-7 h-7 text-base", md: "w-10 h-10 text-xl", lg: "w-14 h-14 text-3xl" };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} ${config.bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <span>{config.emoji}</span>
      </div>
      {showLabel && (
        <span className={`font-semibold ${config.textClass}`}>{config.label}</span>
      )}
    </div>
  );
}

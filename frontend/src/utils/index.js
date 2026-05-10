// ─── constants.js ─────────────────────────────────────────
export const SPORTS = [
  { value: "cricket",    label: "Cricket",    emoji: "🏏" },
  { value: "football",   label: "Football",   emoji: "⚽" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "badminton",  label: "Badminton",  emoji: "🏸" },
  { value: "volleyball", label: "Volleyball", emoji: "🏐" },
  { value: "tennis",     label: "Tennis",     emoji: "🎾" },
  { value: "other",      label: "Other",      emoji: "🎯" },
];

export const SKILL_LEVELS = [
  { value: "beginner",     label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
  { value: "any",          label: "Any level" },
];

export const RADIUS_OPTIONS = [
  { value: 2,   label: "2 km"   },
  { value: 5,   label: "5 km"   },
  { value: 10,  label: "10 km"  },
  { value: 20,  label: "20 km"  },
  { value: 50,  label: "50 km"  },
  { value: 100, label: "100 km" },
  { value: 250, label: "250 km" },
];

export const SORT_OPTIONS = [
  { value: "distance", label: "Nearest first" },
  { value: "latest",   label: "Latest" },
  { value: "popular",  label: "Most popular" },
  { value: "date",     label: "Upcoming" },
];

// ─── helpers.js ───────────────────────────────────────────
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export const formatMatchDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  return format(d, "EEE, MMM d · h:mm a");
};

export const timeAgo = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const getSportEmoji = (sport) => SPORTS.find((s) => s.value === sport)?.emoji || "🎯";

export const getSportBadgeClass = (sport) => `badge badge-${sport}`;

export const getSkillColor = (level) => {
  const map = {
    beginner: "text-green-400",
    intermediate: "text-yellow-400",
    advanced: "text-red-400",
    any: "text-slate-400",
  };
  return map[level] || "text-slate-400";
};

export const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export const formatCurrency = (amount) =>
  amount === 0 ? "Free" : `₹${amount}`;

export const classNames = (...classes) => classes.filter(Boolean).join(" ");

export const truncate = (str, n = 80) => (str?.length > n ? str.slice(0, n) + "…" : str);

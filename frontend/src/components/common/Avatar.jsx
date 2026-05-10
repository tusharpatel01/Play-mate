// ─── Avatar.jsx ───────────────────────────────────────────
import { getInitials } from "../../utils";

const COLORS = [
  "bg-green-800 text-green-300",
  "bg-blue-800 text-blue-300",
  "bg-purple-800 text-purple-300",
  "bg-orange-800 text-orange-300",
  "bg-pink-800 text-pink-300",
  "bg-yellow-800 text-yellow-300",
];

export function Avatar({ src, name = "", size = "md", online = false, className = "" }) {
  const sizes = { xs: "w-6 h-6 text-[9px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg", xl: "w-20 h-20 text-2xl" };
  const colorIdx = name.charCodeAt(0) % COLORS.length;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClass} ${COLORS[colorIdx]} rounded-full flex items-center justify-center font-bold`}>
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-dark-900 rounded-full" />
      )}
    </div>
  );
}

export default Avatar;

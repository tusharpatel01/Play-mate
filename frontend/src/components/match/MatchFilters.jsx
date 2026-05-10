import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SPORTS, SKILL_LEVELS, RADIUS_OPTIONS, SORT_OPTIONS } from "../../utils";

export default function MatchFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = [
    filters.sport !== "all" && filters.sport,
    filters.skillRequired,
    filters.radius !== 10,
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sport chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleChange("sport", "all")}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            filters.sport === "all"
              ? "bg-brand-900/50 border-brand-700 text-brand-400"
              : "border-white/10 text-slate-400 hover:border-white/20"
          }`}
        >
          All Sports
        </button>
        {SPORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => handleChange("sport", filters.sport === s.value ? "all" : s.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filters.sport === s.value
                ? "bg-brand-900/50 border-brand-700 text-brand-400"
                : "border-white/10 text-slate-400 hover:border-white/20"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Advanced filter button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
          open || activeCount > 0
            ? "bg-brand-900/50 border-brand-700 text-brand-400"
            : "border-white/10 text-slate-400 hover:border-white/20"
        }`}
      >
        <SlidersHorizontal size={12} />
        Filters {activeCount > 0 && <span className="bg-brand-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeCount}</span>}
      </button>

      {/* Advanced filters panel */}
      {open && (
        <div className="w-full card p-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Search Radius</label>
              <div className="flex gap-2 flex-wrap">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleChange("radius", r.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      filters.radius === r.value
                        ? "bg-brand-900/50 border-brand-700 text-brand-400"
                        : "border-white/10 text-slate-500 hover:border-white/20"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Skill Level</label>
              <div className="flex gap-2 flex-wrap">
                {SKILL_LEVELS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleChange("skillRequired", filters.skillRequired === s.value ? "" : s.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all ${
                      filters.skillRequired === s.value
                        ? "bg-brand-900/50 border-brand-700 text-brand-400"
                        : "border-white/10 text-slate-500 hover:border-white/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Sort By</label>
              <select
                value={filters.sort || "distance"}
                onChange={(e) => handleChange("sort", e.target.value)}
                className="input text-xs py-1.5"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => onChange({ sport: "all", radius: 10, sort: "distance" })}
            className="mt-3 text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

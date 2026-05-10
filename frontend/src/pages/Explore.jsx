import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, Map, List, Loader } from "lucide-react";
import {
  fetchMatches, selectMatches, selectMatchLoading,
} from "../features/matches/matchSlice";
import { useGeolocation, useDebounce } from "../hooks";
import MatchCard from "../components/match/MatchCard";
import MatchFilters from "../components/match/MatchFilters";
import { MatchesMap } from "../components/common/MatchMap";
import { SkeletonCard, EmptyState } from "../components/common";

export default function Explore() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matches = useSelector(selectMatches);
  const loading = useSelector(selectMatchLoading);
  const { location } = useGeolocation();

  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid"); // "grid" | "map"
  const [filters, setFilters] = useState({
    sport: "all", radius: 10, sort: "distance",
  });
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const params = { ...filters, status: "open" };
    if (debouncedSearch) params.search = debouncedSearch;
    if (location) {
      params.lat = location.lat;
      params.lng = location.lng;
    }
    dispatch(fetchMatches(params));
  }, [debouncedSearch, filters, location, dispatch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Explore Matches</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Find the perfect game near you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors ${
              view === "grid" ? "bg-brand-900/50 text-brand-400" : "btn-ghost"
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setView("map")}
            className={`p-2 rounded-lg transition-colors ${
              view === "map" ? "bg-brand-900/50 text-brand-400" : "btn-ghost"
            }`}
          >
            <Map size={18} />
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        {loading && search && (
          <Loader size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by match title, ground, city..."
          className="input pl-10 pr-10 py-3"
        />
      </div>

      <div className="mb-6">
        <MatchFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Map view (real Google Map) */}
      {view === "map" && (
        <div className="mb-6">
          <MatchesMap
            matches={matches}
            userLocation={location}
            height={420}
            onMarkerClick={(m) => navigate(`/matches/${m._id}`)}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {loading
            ? "Searching..."
            : `${matches.length} result${matches.length !== 1 ? "s" : ""}`}
          {debouncedSearch && ` for "${debouncedSearch}"`}
        </p>
      </div>

      {loading && matches.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m, i) => (
            <MatchCard key={m._id} match={m} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

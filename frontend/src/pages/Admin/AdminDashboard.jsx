import { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Trophy, Flag, Activity, ShieldCheck,
  Ban, CheckCircle, ChevronLeft, Search, AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";
import Avatar from "../../components/common/Avatar";
import { Spinner, EmptyState } from "../../components/common";
import { timeAgo } from "../../utils";
import toast from "react-hot-toast";

// ─── Stat card ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "text-brand-400" }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-3xl font-black ${color}`}>{value ?? "—"}</p>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats")
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Platform Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}    label="Total Users"      value={stats?.users}          color="text-blue-400" />
        <StatCard icon={Trophy}   label="Total Matches"    value={stats?.matches}        color="text-brand-400" />
        <StatCard icon={Activity} label="Active Matches"   value={stats?.activeMatches}  color="text-green-400" />
        <StatCard icon={Flag}     label="Pending Reports"  value={stats?.pendingReports} color="text-red-400" />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-300 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Manage Users",   to: "users",   icon: Users,    color: "text-blue-400"  },
            { label: "View Reports",   to: "reports", icon: Flag,     color: "text-red-400"   },
            { label: "Match Moderation", to: "matches", icon: Trophy, color: "text-brand-400" },
          ].map((a) => (
            <NavLink
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <a.icon size={18} className={a.color} />
              <span className="text-sm font-medium text-slate-300">{a.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users management ─────────────────────────────────────
function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [total, setTotal]     = useState(0);

  const load = (q = "") => {
    setLoading(true);
    api.get("/admin/users", { params: { search: q, limit: 30 } })
      .then(({ data }) => { setUsers(data.data); setTotal(data.total); })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleBan = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}/${isBanned ? "unban" : "ban"}`, {
        reason: "Violated community guidelines.",
      });
      toast.success(isBanned ? "User unbanned." : "User banned.");
      load(search);
    } catch { toast.error("Action failed."); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Users <span className="text-slate-500 text-base font-normal">({total})</span></h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
            placeholder="Search by name..."
            className="input pl-9 py-2 text-sm w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 flex items-center gap-4"
            >
              <Avatar src={u.avatar} name={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-slate-100">{u.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    u.role === "admin"     ? "bg-purple-900/60 text-purple-400" :
                    u.role === "organizer" ? "bg-blue-900/60 text-blue-400" :
                    "bg-white/10 text-slate-400"
                  }`}>{u.role}</span>
                  {u.isBanned && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/60 text-red-400">Banned</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{u.email} · Joined {timeAgo(u.createdAt)}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {u.matchesPlayed} matches · {u.matchesOrganised} organised · ⭐ {u.averageRating || "—"}
                </p>
              </div>
              {u.role !== "admin" && (
                <button
                  onClick={() => handleBan(u._id, u.isBanned)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    u.isBanned
                      ? "border-brand-700 text-brand-400 hover:bg-brand-900/30"
                      : "border-red-700/50 text-red-400 hover:bg-red-900/20"
                  }`}
                >
                  {u.isBanned ? <><CheckCircle size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────
function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/admin/reports")
      .then(({ data }) => setReports(data.data))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id, status) => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      toast.success(`Report marked as ${status}.`);
      load();
    } catch { toast.error("Failed to resolve report."); }
  };

  const REASON_COLORS = {
    spam:          "text-orange-400",
    fake:          "text-yellow-400",
    abusive:       "text-red-400",
    inappropriate: "text-pink-400",
    other:         "text-slate-400",
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">
        Pending Reports <span className="text-slate-500 text-base font-normal">({reports.length})</span>
      </h2>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={24} /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="No pending reports" description="All reports have been resolved." />
      ) : (
        <div className="space-y-3">
          {reports.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AlertTriangle size={14} className={REASON_COLORS[r.reason] || "text-slate-400"} />
                    <span className={`text-sm font-semibold capitalize ${REASON_COLORS[r.reason]}`}>{r.reason}</span>
                    <span className="text-xs text-slate-500">· {timeAgo(r.createdAt)}</span>
                  </div>
                  {r.description && (
                    <p className="text-sm text-slate-400 italic">"{r.description}"</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap">
                <span>
                  <span className="text-slate-400 font-medium">Reporter:</span>{" "}
                  {r.reporter?.name} ({r.reporter?.email})
                </span>
                {r.reportedUser && (
                  <span>
                    <span className="text-slate-400 font-medium">Reported user:</span>{" "}
                    {r.reportedUser?.name} ({r.reportedUser?.email})
                  </span>
                )}
                {r.reportedMatch && (
                  <span>
                    <span className="text-slate-400 font-medium">Reported match:</span>{" "}
                    {r.reportedMatch?.title}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => resolve(r._id, "resolved")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-900/50 border border-brand-700 text-brand-400 hover:bg-brand-900 transition-colors"
                >
                  <CheckCircle size={13} /> Resolve
                </button>
                <button
                  onClick={() => resolve(r._id, "dismissed")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:border-white/20 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin Dashboard shell ────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const NAV = [
    { to: "", end: true, icon: Activity, label: "Overview" },
    { to: "users",       icon: Users,   label: "Users" },
    { to: "reports",     icon: Flag,    label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-dark-850">
      {/* Top bar */}
      <div className="bg-dark-900 border-b border-white/[0.07] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/home")}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <ChevronLeft size={16} /> Back to app
        </button>
        <div className="flex items-center gap-2 ml-2">
          <ShieldCheck size={18} className="text-purple-400" />
          <span className="font-bold text-slate-200">Admin Panel</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <nav className="space-y-0.5">
            {NAV.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-purple-900/40 text-purple-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route index      element={<Overview />} />
            <Route path="users"   element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

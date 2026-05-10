import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, MapPin, Users, MessageCircle, ChevronRight, Star, Zap } from "lucide-react";

const SPORTS = [
  { emoji: "🏏", name: "Cricket",    color: "text-green-400",  bg: "bg-green-900/30" },
  { emoji: "⚽", name: "Football",   color: "text-blue-400",   bg: "bg-blue-900/30" },
  { emoji: "🏀", name: "Basketball", color: "text-orange-400", bg: "bg-orange-900/30" },
  { emoji: "🏸", name: "Badminton",  color: "text-purple-400", bg: "bg-purple-900/30" },
  { emoji: "🏐", name: "Volleyball", color: "text-yellow-400", bg: "bg-yellow-900/30" },
  { emoji: "🎾", name: "Tennis",     color: "text-pink-400",   bg: "bg-pink-900/30" },
];

const FEATURES = [
  { icon: MapPin,        title: "Location Discovery",  desc: "Find matches within 2–20km. Filter by sport, skill level, and availability." },
  { icon: Users,         title: "Join or Organise",    desc: "Create a match and fill your squad, or join one with a single request." },
  { icon: MessageCircle, title: "Real-time Chat",      desc: "Group chat per match and direct messages. Stay coordinated, always." },
  { icon: Zap,           title: "Instant Matching",    desc: "Organizer accepts your request, you're in — chat unlocks immediately." },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-850 text-slate-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-850/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">PlayMate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 max-w-6xl mx-auto text-center">
        <motion.div {...fadeUp(0)}>
          <span className="inline-flex items-center gap-2 text-xs bg-brand-900/50 border border-brand-800/60 text-brand-400 px-4 py-1.5 rounded-full mb-6">
            <MapPin size={12} /> Location-based sports matching · India
          </span>
        </motion.div>

        <motion.h1 {...fadeUp(0.1)} className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 leading-none">
          Find your perfect
          <br />
          <span className="text-brand-400">Sport Mates</span>
        </motion.h1>

        <motion.p {...fadeUp(0.2)} className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Connect with nearby players, join matches, and never sit out a game again.
          PlayMate makes local sports social.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
            Find matches near me <ChevronRight size={18} />
          </Link>
          <Link to="/explore" className="btn-secondary text-base px-8 py-3">
            Browse matches
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div {...fadeUp(0.4)} className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          {[["500+", "Active matches"], ["2,000+", "Players joined"], ["4.9", "Avg rating"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-black text-brand-400">{n}</p>
              <p className="text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Sports */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <motion.div {...fadeUp(0)} className="text-center mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Supported sports</p>
          <h2 className="text-2xl font-bold">One platform, every sport</h2>
        </motion.div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {SPORTS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`card p-4 text-center hover:scale-105 transition-transform cursor-default`}
            >
              <div className="text-3xl mb-2">{s.emoji}</div>
              <p className={`text-xs font-semibold ${s.color}`}>{s.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight mb-3">How PlayMate works</h2>
          <p className="text-slate-500">From discovery to first ball in minutes</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-5"
            >
              <div className="w-10 h-10 bg-brand-900/50 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={20} className="text-brand-400" />
              </div>
              <h3 className="font-bold mb-2 text-slate-100">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center card p-10 border-brand-900/40">
          <Trophy size={40} className="text-brand-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-4">Ready to play?</h2>
          <p className="text-slate-400 mb-8">Join thousands of players finding games near them every day.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-3 inline-flex items-center gap-2">
            Create free account <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-4 text-center">
        <p className="text-slate-600 text-sm">© 2026 PlayMate · Built for sports lovers</p>
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-850 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Giant 404 */}
        <div className="relative mb-8">
          <p className="text-[10rem] font-black text-white/[0.04] leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-brand-900/50 rounded-3xl flex items-center justify-center">
              <Trophy size={40} className="text-brand-400" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-100 mb-3">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Looks like this match doesn't exist — or the game already ended.
          Head back to find your next one.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/home" className="btn-primary flex items-center justify-center gap-2">
            <Home size={16} /> Back to Home
          </Link>
          <Link to="/explore" className="btn-secondary flex items-center justify-center gap-2">
            Explore Matches
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

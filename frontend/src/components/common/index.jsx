import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// ─── Modal ────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full ${sizes[size]} card p-6 z-10 max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-100">{title}</h2>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ size = 20, className = "" }) {
  return (
    <svg
      className={`animate-spin text-brand-400 ${className}`}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── EmptyState ───────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {Icon && (
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────
export function SportBadge({ sport }) {
  return <span className={`badge badge-${sport} capitalize`}>{sport}</span>;
}

export function StatusBadge({ status }) {
  const labels = { open: "Open", full: "Full", in_progress: "Live", completed: "Done", cancelled: "Cancelled" };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

// ─── ConfirmDialog ────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-slate-400 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            danger ? "bg-red-600 hover:bg-red-700 text-white" : "btn-primary"
          }`}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

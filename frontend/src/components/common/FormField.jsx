// ─── components/common/FormField.jsx ─────────────────────
export function FormField({ label, error, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 block">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── components/common/Input.jsx ──────────────────────────
import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  { className = "", error, icon: Icon, ...props },
  ref
) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      )}
      <input
        ref={ref}
        className={`input ${Icon ? "pl-9" : ""} ${error ? "border-red-500/50 focus:border-red-500" : ""} ${className}`}
        {...props}
      />
    </div>
  );
});

// ─── components/common/Select.jsx ─────────────────────────
export const Select = forwardRef(function Select(
  { className = "", error, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={`input appearance-none ${error ? "border-red-500/50" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

// ─── components/common/Textarea.jsx ───────────────────────
export const Textarea = forwardRef(function Textarea(
  { className = "", error, rows = 3, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input resize-none ${error ? "border-red-500/50" : ""} ${className}`}
      {...props}
    />
  );
});

// ─── components/common/Toggle.jsx ─────────────────────────
export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-white/10 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
      </div>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-slate-300">{label}</p>}
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      )}
    </label>
  );
}

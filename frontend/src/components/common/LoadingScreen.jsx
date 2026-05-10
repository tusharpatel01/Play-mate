import { Trophy } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-dark-850 flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center animate-pulse">
          <Trophy size={32} className="text-white" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-slate-500 text-sm">Loading PlayMate...</p>
      </div>
    </div>
  );
}

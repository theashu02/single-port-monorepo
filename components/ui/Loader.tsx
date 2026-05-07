import { Sparkles } from "lucide-react";
import { memo } from "react";

const Loader = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-transparent p-4">
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-90 duration-700">
        <div className="w-32 h-32 rounded-full bg-transparent text-primary-foreground flex items-center justify-center motion-safe:animate-pulse">
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A73E8" /> {/* Deep Blue */}
                <stop offset="40%" stopColor="#9b72cb" /> {/* Gemini Purple */}
                <stop offset="100%" stopColor="#d96570" /> {/* Warm Coral/Pink */}
              </linearGradient>
            </defs>
          </svg>
          <Sparkles className="w-32 h-32 duration-500" strokeWidth={1} stroke="url(#gemini-gradient)" />
        </div>
        <p className="text-muted-foreground text-sm font-bold tracking-[0.25em] uppercase motion-safe:animate-pulse delay-75">Setting things up…</p>
      </div>
    </div>
  );
};

export default memo(Loader);

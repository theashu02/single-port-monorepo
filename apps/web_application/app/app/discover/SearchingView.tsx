"use client";

import { RefreshCw, X } from "lucide-react";
import { formatElapsed } from "@/lib/utils/formatElapsed";
import { Button } from "@/components/ui/button";

interface SearchingViewProps {
  onCancel: () => void;
  elapsed: number;
  queuePosition: number | null;
}

export default function SearchingView({
  onCancel,
  elapsed,
  queuePosition,
}: SearchingViewProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute h-40 w-40 animate-ping rounded-full border border-violet-500/30"
          style={{ animationDuration: "2s" }}
        />
        <div
          className="absolute h-32 w-32 animate-ping rounded-full border border-fuchsia-500/20"
          style={{ animationDuration: "2.5s" }}
        />
        <div
          className="absolute h-24 w-24 animate-ping rounded-full border border-cyan-400/20"
          style={{ animationDuration: "3s" }}
        />
        <div className="relative grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <RefreshCw
            className="h-8 w-8 animate-spin text-violet-400"
            style={{ animationDuration: "3s" }}
          />
        </div>
      </div>

      <div>
        <h2 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Finding Your Match
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Vibing through online queues to find your partner…
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <span className="font-mono text-sm font-medium text-white/70">
            {formatElapsed(elapsed)}
          </span>
        </div>
        {queuePosition !== null && (
          <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2">
            <span className="text-sm font-medium text-violet-300">
              #{queuePosition} in queue
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={onCancel}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white active:scale-95"
      >
        <X className="h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
}

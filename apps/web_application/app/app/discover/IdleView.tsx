'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Search } from 'lucide-react';

interface IdleViewProps {
  onStart: () => void;
  onlineCount: number;
}

export default function IdleView({ onStart, onlineCount }: IdleViewProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative">
        <Sparkles className="h-32 w-32 text-violet-400" />
      </div>
      <div>
        <h2 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Discover Someone New
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/60">
          Get matched with a random online user for a direct anonymous conversation.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          {onlineCount.toLocaleString()} online now
        </span>
      </div>

      <Button
        onClick={onStart}
        className="rounded-xl px-10 py-5 text-base font-bold tracking-wide transition-all hover:scale-105 hover:shadow-violet-500/40 active:scale-95"
      >
        <span className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Start Matching
        </span>
      </Button>
    </div>
  );
}

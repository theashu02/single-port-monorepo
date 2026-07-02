"use client";

import { useEffect, useState } from "react";

export function useElapsedTimer(startedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

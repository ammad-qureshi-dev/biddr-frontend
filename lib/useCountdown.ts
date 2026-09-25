"use client";

import { useEffect, useState } from "react";

export type Countdown = {
  totalMs: number;
  hh: string;
  mm: string;
  ss: string;
  isExpired: boolean;
  isUnderFiveMinutes: boolean;
  isUnderOneMinute: boolean;
};

function computeCountdown(targetIso: string): Countdown {
  const totalMs = new Date(targetIso).getTime() - Date.now();
  const clamped = Math.max(totalMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    totalMs,
    hh: pad(hh),
    mm: pad(mm),
    ss: pad(ss),
    isExpired: totalMs <= 0,
    isUnderFiveMinutes: totalMs > 0 && totalMs <= 5 * 60 * 1000,
    isUnderOneMinute: totalMs > 0 && totalMs <= 60 * 1000,
  };
}

export function useCountdown(targetIso: string | null | undefined): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(
    targetIso ? computeCountdown(targetIso) : null,
  );

  useEffect(() => {
    function tick() {
      setCountdown(targetIso ? computeCountdown(targetIso) : null);
    }
    tick();
    if (!targetIso) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return countdown;
}

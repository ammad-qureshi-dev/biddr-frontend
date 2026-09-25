"use client";

import { useCountdown } from "@/lib/useCountdown";

export function CountdownTimer({
  target,
  size = "md",
  expiredLabel = "Ended",
  onDark = false,
}: {
  target: string;
  size?: "sm" | "md" | "lg";
  expiredLabel?: string;
  onDark?: boolean;
}) {
  const countdown = useCountdown(target);
  if (!countdown) return null;

  if (countdown.isExpired) {
    return (
      <span className="tabular-ticker text-slate-500">{expiredLabel}</span>
    );
  }

  const sizeClass =
    size === "lg" ? "text-5xl" : size === "sm" ? "text-sm" : "text-xl";
  const urgentClass = countdown.isUnderFiveMinutes
    ? "text-ledger-red animate-pulse-urgent"
    : onDark
      ? "text-paper-50"
      : "text-ink-950";

  return (
    <span
      className={`tabular-ticker font-semibold ${sizeClass} ${urgentClass}`}
      aria-label={`${countdown.hh} hours ${countdown.mm} minutes ${countdown.ss} seconds remaining`}
    >
      {countdown.hh}:{countdown.mm}:
      <span className={countdown.isUnderOneMinute ? "font-bold" : ""}>
        {countdown.ss}
      </span>
    </span>
  );
}

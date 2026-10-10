"use client";

import { useCountdown } from "@/lib/useCountdown";

export function CountdownTimer({
  target,
  size = "md",
  expiredLabel = "Ended",
}: {
  target: string;
  size?: "sm" | "md" | "lg";
  expiredLabel?: string;
}) {
  const countdown = useCountdown(target);
  if (!countdown) return null;

  const sizeClass = size === "lg" ? "text-[28px] leading-none" : size === "sm" ? "text-[13px]" : "text-lg";

  if (countdown.isExpired) {
    return <span className={`tabular-ticker font-medium text-muted ${sizeClass}`}>{expiredLabel}</span>;
  }

  const urgentClass = countdown.isUnderFiveMinutes ? "text-danger animate-pulse-urgent" : "text-fg";

  return (
    <span
      className={`tabular-ticker font-semibold ${sizeClass} ${urgentClass}`}
      aria-label={`${countdown.hh} hours ${countdown.mm} minutes ${countdown.ss} seconds remaining`}
    >
      {countdown.hh}:{countdown.mm}:
      <span className={countdown.isUnderOneMinute ? "font-bold" : ""}>{countdown.ss}</span>
    </span>
  );
}

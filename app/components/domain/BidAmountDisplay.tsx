import { formatMoney } from "@/lib/format";

type State = "default" | "winning" | "outbid";

export function BidAmountDisplay({
  amount,
  state = "default",
  label = "Current Bid",
  bidCount,
  reserveMet,
  size = "md",
  onDark = false,
}: {
  amount: number | null;
  state?: State;
  label?: string;
  bidCount?: number;
  reserveMet?: boolean;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}) {
  const colorClass =
    state === "winning"
      ? "text-ledger-green"
      : state === "outbid"
        ? "text-ledger-red"
        : onDark
          ? "text-paper-50"
          : "text-ink-950";

  const sizeClass = size === "lg" ? "text-5xl" : size === "sm" ? "text-lg" : "text-3xl";

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`font-sans text-[11px] font-semibold uppercase tracking-wider ${onDark ? "text-slate-200" : "text-slate-500"}`}
      >
        {label}
      </span>
      <span
        key={amount ?? "none"}
        className={`tabular-ticker font-semibold animate-snap ${sizeClass} ${colorClass}`}
      >
        {formatMoney(amount)}
      </span>
      <div className="flex items-center gap-2">
        {typeof bidCount === "number" && (
          <span className={`font-sans text-xs ${onDark ? "text-slate-200" : "text-slate-500"}`}>
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </span>
        )}
        {state === "winning" && (
          <span className="font-sans text-xs font-semibold text-ledger-green">
            you&apos;re winning
          </span>
        )}
        {state === "outbid" && (
          <span className="font-sans text-xs font-semibold text-ledger-red">
            outbid — bid again
          </span>
        )}
        {reserveMet === false && (
          <span className="font-sans text-xs font-semibold text-ledger-red">
            reserve not met
          </span>
        )}
      </div>
    </div>
  );
}

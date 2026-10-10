import { Flag } from "lucide-react";
import { formatMoney } from "@/lib/format";

type State = "default" | "winning" | "outbid";

export function BidAmountDisplay({
  amount,
  state = "default",
  label = "Current Bid",
  bidCount,
  reserveMet,
}: {
  amount: number | null;
  state?: State;
  label?: string;
  bidCount?: number;
  reserveMet?: boolean;
}) {
  const colorClass = state === "winning" ? "text-success" : state === "outbid" ? "text-danger" : "text-fg";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] text-muted">{label}</span>
      <span
        key={amount ?? "none"}
        className={`tabular-ticker animate-snap text-[40px] font-semibold leading-none tracking-[-0.03em] ${colorClass}`}
      >
        {formatMoney(amount)}
      </span>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        {typeof bidCount === "number" && (
          <span className="text-muted">
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </span>
        )}
        {state === "winning" && <span className="text-success">You&apos;re winning</span>}
        {state === "outbid" && <span className="text-danger">Outbid — bid again</span>}
        {reserveMet === false && (
          <span className="inline-flex items-center gap-1 text-danger">
            <Flag className="h-3 w-3" />
            Reserve not met
          </span>
        )}
      </div>
    </div>
  );
}

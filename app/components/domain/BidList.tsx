import type { BidSummaryResponse } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { BidStatusPill } from "./StatusPills";

function bidderLabel(bidderId: string, currentUserId?: string) {
  if (currentUserId && bidderId === currentUserId) return "You";
  return `Bidder ${bidderId.slice(0, 6)}`;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Renders bid activity either as a compact light table (item detail) or a dark live ticker (auction room). */
export function BidList({
  bids,
  currentUserId,
  variant = "table",
}: {
  bids: BidSummaryResponse[];
  currentUserId?: string;
  variant?: "table" | "ticker";
}) {
  const sorted = [...bids].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <p
        className={`font-sans text-sm ${variant === "ticker" ? "text-slate-200" : "text-slate-500"}`}
      >
        No bids yet — be the first.
      </p>
    );
  }

  if (variant === "ticker") {
    return (
      <div className="flex flex-col gap-2">
        {sorted.map((bid) => (
          <div
            key={bid.id}
            className="animate-slide-down flex items-center justify-between border-b border-slate-700 pb-2"
          >
            <div className="flex flex-col">
              <span className="font-sans text-sm text-paper-50">
                {bidderLabel(bid.bidderId, currentUserId)}
              </span>
              <span className="tabular-ticker text-xs text-slate-200">
                {timeLabel(bid.placedAt)}
              </span>
            </div>
            <span className="tabular-ticker text-base font-semibold text-paper-50">
              {formatMoney(bid.amount)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse font-sans text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="py-2 font-medium">Bidder</th>
          <th className="py-2 font-medium">Placed</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 text-right font-medium">Amount</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((bid) => (
          <tr key={bid.id} className="border-b border-slate-200/60">
            <td className="py-2 text-ink-950">{bidderLabel(bid.bidderId, currentUserId)}</td>
            <td className="tabular-ticker py-2 text-xs text-slate-500">
              {timeLabel(bid.placedAt)}
            </td>
            <td className="py-2">
              <BidStatusPill status={bid.status} />
            </td>
            <td className="tabular-ticker py-2 text-right font-semibold text-ink-950">
              {formatMoney(bid.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

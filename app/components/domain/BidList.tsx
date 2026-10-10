"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BidSummaryResponse } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { BidStatusPill } from "./StatusPills";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Bid activity table. No bidder identity is ever shown — rows are anonymous — but the viewer's own
 * bid (matched via `currentUserId`) is highlighted so they can spot it in the ranking. Bids are
 * rendered in the order given — callers pass already-ranked data (e.g. the top-ten-bids endpoint
 * ranks by amount descending), so this doesn't re-sort. A row with a `statusDescription` (e.g. a
 * rejection reason) gets a chevron that expands to show it.
 */
export function BidList({
  bids: sorted,
  currentUserId,
}: {
  bids: BidSummaryResponse[];
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (sorted.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">No bids yet — be the first.</p>;
  }

  return (
    <div className="max-h-[28rem] overflow-y-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="sticky top-0 border-b border-line bg-surface text-left text-[13px] text-muted">
            <th className="w-10 py-3 pl-5 font-normal">#</th>
            <th className="py-3 font-normal">Placed</th>
            <th className="py-3 font-normal">Status</th>
            <th className="py-3 pr-5 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((bid, i) => {
            const isMine = !!currentUserId && bid.bidderId === currentUserId;
            const hasReason = !!bid.statusDescription;
            const isOpen = hasReason && expanded.has(bid.id);
            const rowClass = isMine ? "bg-subtle" : "";
            return (
              <Fragment key={bid.id}>
                <tr className={`${rowClass} ${isOpen ? "" : "border-b border-line last:border-b-0"}`}>
                  <td className="tabular-ticker py-3 pl-5 text-xs text-faint">{i + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {hasReason && (
                        <button
                          type="button"
                          onClick={() => toggle(bid.id)}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "Hide reason" : "Show reason"}
                          className="-ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg"
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      )}
                      <span className="tabular-ticker text-[13px] text-muted">{timeLabel(bid.placedAt)}</span>
                      {isMine && <span className="text-[13px] font-medium text-fg">· You</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    <BidStatusPill status={bid.status} />
                  </td>
                  <td className="tabular-ticker py-3 pr-5 text-right font-semibold text-fg">{formatMoney(bid.amount)}</td>
                </tr>
                {isOpen && (
                  <tr className={`border-b border-line ${rowClass}`}>
                    <td colSpan={4} className="pb-3 pl-14 pr-5 text-xs text-muted">
                      {bid.statusDescription}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

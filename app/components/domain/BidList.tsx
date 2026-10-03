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
 * Renders bid activity either as a compact light table (item detail) or a dark live ticker
 * (auction room). No bidder identity is ever shown — rows are anonymous — but the viewer's own
 * bid (matched via `currentUserId`) is highlighted so they can spot it in the ranking. Bids are
 * rendered in the order given — callers pass already-ranked data (e.g. the top-ten-bids endpoint
 * ranks by amount descending), so this doesn't re-sort. In the table variant, a row with a
 * `statusDescription` (e.g. a rejection reason) gets a chevron that expands to show it.
 */
export function BidList({
  bids: sorted,
  currentUserId,
  variant = "table",
}: {
  bids: BidSummaryResponse[];
  currentUserId?: string;
  variant?: "table" | "ticker";
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
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {sorted.map((bid) => {
          const isMine = !!currentUserId && bid.bidderId === currentUserId;
          return (
            <div
              key={bid.id}
              className={`animate-slide-down flex items-center justify-between border-b border-l-2 border-slate-700 pb-2 pl-2 ${
                isMine ? "border-l-brass-500 bg-brass-500/10" : "border-l-transparent"
              }`}
            >
              <span className="tabular-ticker text-xs text-slate-200">
                {timeLabel(bid.placedAt)}
              </span>
              <span className="tabular-ticker text-base font-semibold text-paper-50">
                {formatMoney(bid.amount)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full border-collapse font-sans text-sm">
        <thead>
          <tr className="sticky top-0 border-b border-slate-200 bg-paper-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="w-8 py-2 pl-2 font-medium">
              <span className="sr-only">Details</span>
            </th>
            <th className="py-2 font-medium">Placed</th>
            <th className="py-2 font-medium">Status</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((bid) => {
            const isMine = !!currentUserId && bid.bidderId === currentUserId;
            const hasReason = !!bid.statusDescription;
            const isOpen = hasReason && expanded.has(bid.id);
            const rowClass = `border-l-2 border-slate-200/60 ${
              isMine ? "border-l-brass-500 bg-brass-500/10" : "border-l-transparent"
            }`;
            return (
              <Fragment key={bid.id}>
                <tr className={`${rowClass} ${isOpen ? "" : "border-b"}`}>
                  <td className="w-8 py-2 pl-2">
                    {hasReason && (
                      <button
                        type="button"
                        onClick={() => toggle(bid.id)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Hide reason" : "Show reason"}
                        className="flex items-center text-slate-500 hover:text-ink-950"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
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
                {isOpen && (
                  <tr className={`border-b ${rowClass}`}>
                    <td colSpan={4} className="py-2 pl-8 pr-2 font-sans text-xs text-slate-500">
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

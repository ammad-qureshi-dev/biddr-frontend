import Link from "next/link";
import type { AuctionSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { AuctionStatusPill } from "./StatusPills";
import { CountdownTimer } from "./CountdownTimer";

export function AuctionCard({ auction }: { auction: AuctionSummaryResponse }) {
  const target = auction.status === "LIVE" ? auction.endTime : auction.startTime;
  const reference = auction.id.slice(0, 8).toUpperCase();

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-paper-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,23,31,0.08)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-ink-950">
        <span className="font-display text-lg font-medium text-paper-50/40">
          {CATEGORY_LABELS[auction.categories[0]] ?? "Auction"}
        </span>
        <div className="absolute right-3 top-3">
          <AuctionStatusPill status={auction.status} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="tabular-ticker text-xs text-slate-500">LOT {reference}</span>
          {(auction.status === "LIVE" || auction.status === "UPCOMING") && (
            <CountdownTimer target={target} size="sm" />
          )}
        </div>
        <h3 className="font-display text-xl font-semibold leading-tight text-ink-950">
          {auction.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {auction.categories.slice(0, 2).map((c) => (
            <span
              key={c}
              className="rounded-full bg-slate-200/60 px-2 py-0.5 font-sans text-[11px] text-slate-500"
            >
              {CATEGORY_LABELS[c]}
            </span>
          ))}
          {auction.categories.length > 2 && (
            <span className="font-sans text-[11px] text-slate-500">
              +{auction.categories.length - 2}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between font-sans text-xs text-slate-500">
          <span>
            {auction.itemCount} {auction.itemCount === 1 ? "item" : "items"}
          </span>
          <span>{formatDateTime(auction.startTime)}</span>
        </div>
      </div>
    </Link>
  );
}

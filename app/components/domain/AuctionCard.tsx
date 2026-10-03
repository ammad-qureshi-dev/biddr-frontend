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
    <Link href={`/auctions/${auction.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-100">
        <div className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <span className="font-display text-lg font-medium text-slate-500">
            {CATEGORY_LABELS[auction.categories[0]] ?? "Auction"}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <AuctionStatusPill status={auction.status} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="tabular-ticker text-xs text-slate-500">LOT {reference}</span>
          {(auction.status === "LIVE" || auction.status === "UPCOMING") && (
            <CountdownTimer target={target} size="sm" />
          )}
        </div>
        <h3 className="font-display text-base font-semibold leading-tight text-ink-950">
          {auction.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {auction.categories.slice(0, 2).map((c) => (
            <span key={c} className="font-sans text-[13px] text-slate-500">
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
        <div className="mt-0.5 flex items-center justify-between font-sans text-[13px] text-slate-500">
          <span>
            {auction.itemCount} {auction.itemCount === 1 ? "item" : "items"}
          </span>
          <span>{formatDateTime(auction.startTime)}</span>
        </div>
      </div>
    </Link>
  );
}

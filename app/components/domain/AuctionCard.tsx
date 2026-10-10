import Link from "next/link";
import type { AuctionSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDateTime, formatPickupCity } from "@/lib/format";
import { AuctionStatusPill } from "./StatusPills";
import { CountdownTimer } from "./CountdownTimer";
import { Package } from "lucide-react";
import { CATEGORY_ICONS } from "./categoryIcons";

export function AuctionCard({ auction }: { auction: AuctionSummaryResponse }) {
  const Icon = CATEGORY_ICONS[auction.categories[0]] ?? Package;

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group flex h-full gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate text-[15px] font-medium text-fg">{auction.title}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {auction.categories.map((c) => CATEGORY_LABELS[c]).join(", ") || "Uncategorized"} ·{" "}
          {auction.itemCount} {auction.itemCount === 1 ? "item" : "items"}
        </p>
        {auction.pickupLocation && (
          <p className="truncate text-[13px] text-muted">Pickup in {formatPickupCity(auction.pickupLocation)}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <AuctionStatusPill status={auction.status} />
          <span className="text-[13px] text-muted">
            {auction.status === "LIVE" || auction.status === "UPCOMING" ? (
              <>
                {auction.status === "LIVE" ? "Ends in " : "Starts in "}
                <CountdownTimer target={auction.status === "LIVE" ? auction.endTime : auction.startTime} size="sm" />
              </>
            ) : (
              <span className="tabular-ticker">{formatDateTime(auction.endTime)}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

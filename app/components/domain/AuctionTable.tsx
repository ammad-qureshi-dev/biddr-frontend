"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AuctionSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDateTime, formatPickupCity } from "@/lib/format";
import { AuctionStatusPill } from "./StatusPills";

/** Dense table of auction summaries; every row links through to the auction. */
export function AuctionTable({
  auctions,
  rowRef,
}: {
  auctions: AuctionSummaryResponse[];
  /** Attached to the row at `rowRef.index`, e.g. to trigger infinite scroll. */
  rowRef?: { index: number; ref: (el: HTMLTableRowElement | null) => void };
}) {
  const router = useRouter();
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[13px] text-muted">
            <th className="px-5 py-2.5 font-normal">Auction</th>
            <th className="px-3 py-2.5 font-normal">Status</th>
            <th className="px-3 py-2.5 text-right font-normal">Items</th>
            <th className="px-3 py-2.5 font-normal">Pickup</th>
            <th className="px-3 py-2.5 font-normal">Starts</th>
            <th className="px-3 py-2.5 font-normal">Ends</th>
            <th className="w-10 px-3 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((a, i) => (
            <tr
              key={a.id}
              ref={rowRef && i === rowRef.index ? rowRef.ref : undefined}
              onClick={() => router.push(`/auctions/${a.id}`)}
              className="cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle"
            >
              <td className="px-5 py-3.5">
                <div className="min-w-0">
                  <Link
                    href={`/auctions/${a.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block truncate font-medium text-fg hover:underline"
                  >
                    {a.title}
                  </Link>
                  <span className="block truncate text-[13px] text-muted">
                    {a.categories.map((c) => CATEGORY_LABELS[c]).join(", ") || "Uncategorized"}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <AuctionStatusPill status={a.status} />
              </td>
              <td className="tabular-ticker px-3 py-3.5 text-right text-fg">{a.itemCount}</td>
              <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatPickupCity(a.pickupLocation)}</td>
              <td className="tabular-ticker whitespace-nowrap px-3 py-3.5 text-muted">{formatDateTime(a.startTime)}</td>
              <td className="tabular-ticker whitespace-nowrap px-3 py-3.5 text-muted">{formatDateTime(a.endTime)}</td>
              <td className="px-3 py-3.5 text-faint">
                <ChevronRight className="h-4 w-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

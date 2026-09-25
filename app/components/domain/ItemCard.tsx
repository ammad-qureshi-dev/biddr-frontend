import Link from "next/link";
import type { ItemSummaryResponse } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { ItemSoldBadge } from "./StatusPills";

export function ItemCard({
  item,
  auctionId,
}: {
  item: ItemSummaryResponse;
  auctionId: string;
}) {
  return (
    <Link
      href={`/auctions/${auctionId}/items/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-paper-100 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,23,31,0.08)]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-paper-100 border-b border-slate-200">
        <span className="font-display text-4xl text-slate-200">
          {item.title.charAt(0).toUpperCase()}
        </span>
        {item.sold && (
          <div className="absolute right-3 top-3">
            <ItemSoldBadge />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <h4 className="font-display text-lg font-semibold leading-tight text-ink-950">
          {item.title}
        </h4>
        <p className="line-clamp-2 font-sans text-sm text-slate-500">{item.description}</p>
        {item.minimumPrice !== null && (
          <span className="font-sans text-xs text-slate-500">
            Reserve {formatMoney(item.minimumPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}

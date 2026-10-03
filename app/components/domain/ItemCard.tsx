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
    <Link href={`/auctions/${auctionId}/items/${item.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-100">
        <div className="flex h-full w-full items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <span className="font-display text-4xl text-slate-200">
            {item.title.charAt(0).toUpperCase()}
          </span>
        </div>
        {item.sold && (
          <div className="absolute right-3 top-3">
            <ItemSoldBadge />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="font-display text-base font-semibold leading-tight text-ink-950">
          {item.title}
        </h4>
        <p className="line-clamp-2 font-sans text-[13px] text-slate-500">{item.description}</p>
        {item.minimumPrice !== null && (
          <span className="font-sans text-[13px] text-slate-500">
            Reserve {formatMoney(item.minimumPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { bidApi, itemApi } from "@/lib/api";
import type { BidStatus, BidSummaryResponse, ItemResponse } from "@/lib/types";
import { getAuctionForItem } from "@/lib/item-auction-cache";
import { formatMoney, formatDateTime } from "@/lib/format";
import { BidStatusPill } from "../components/domain/StatusPills";
import { EmptyState } from "../components/ui/EmptyState";

const TABS = [
  { key: "ALL", label: "All", statuses: null },
  { key: "WINNING", label: "Winning", statuses: ["ACTIVE"] },
  { key: "OUTBID", label: "Outbid", statuses: ["OUTBID"] },
  { key: "WON", label: "Won", statuses: ["WINNER"] },
  { key: "LOST", label: "Lost", statuses: ["REJECTED", "WITHDRAWN"] },
] as const;

export default function MyBidsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bids, setBids] = useState<BidSummaryResponse[] | null>(null);
  const [items, setItems] = useState<Record<string, ItemResponse>>({});
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    bidApi.getMyBids().then(async (fetched) => {
      setBids(fetched);
      const uniqueItemIds = [...new Set(fetched.map((b) => b.itemId))];
      const fetchedItems = await Promise.all(uniqueItemIds.map((id) => itemApi.getById(id)));
      setItems(Object.fromEntries(fetchedItems.map((it) => [it.id, it])));
    });
  }, [user]);

  if (!user) return null;

  const activeTab = TABS.find((t) => t.key === tab)!;
  const filtered = (bids ?? []).filter(
    (b) => !activeTab.statuses || (activeTab.statuses as readonly BidStatus[]).includes(b.status),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-950">My Bids</h1>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-sans text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-brass-500 text-ink-950"
                : "text-slate-500 hover:text-ink-950"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {bids === null ? (
          <p className="font-sans text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="You haven't bid on anything yet"
            body="Browse live auctions and place your first bid."
            actionLabel="Browse auctions"
            actionHref="/"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((bid) => {
              const item = items[bid.itemId];
              const auctionId = getAuctionForItem(bid.itemId);
              const row = (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-paper-100 p-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans font-medium text-ink-950">
                      {item?.title ?? "Item"}
                    </span>
                    <span className="font-sans text-xs text-slate-500">
                      Placed {formatDateTime(bid.placedAt)}
                    </span>
                    {bid.statusDescription && bid.status === "REJECTED" && (
                      <span className="font-sans text-xs text-ledger-red">
                        {bid.statusDescription}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <BidStatusPill status={bid.status} />
                    <span className="tabular-ticker font-semibold text-ink-950">
                      {formatMoney(bid.amount)}
                    </span>
                  </div>
                </div>
              );
              return auctionId ? (
                <Link key={bid.id} href={`/auctions/${auctionId}/items/${bid.itemId}`}>
                  {row}
                </Link>
              ) : (
                <div key={bid.id}>{row}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { bidApi, itemApi } from "@/lib/api";
import type { BidStatus, BidSummaryResponse, ItemResponse } from "@/lib/types";
import { getAuctionForItem } from "@/lib/item-auction-cache";
import { formatMoney, formatDateTime } from "@/lib/format";
import { BidStatusPill } from "../components/domain/StatusPills";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Segmented } from "../components/ui/Segmented";

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

  const inTab = (t: (typeof TABS)[number], b: BidSummaryResponse) =>
    !t.statuses || (t.statuses as readonly BidStatus[]).includes(b.status);
  const activeTab = TABS.find((t) => t.key === tab)!;
  const filtered = (bids ?? []).filter((b) => inTab(activeTab, b));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Bids" description="Every bid you've placed, across all auctions." />

      <Segmented
        label="Filter bids by status"
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => ({
          value: t.key,
          label: (
            <>
              {t.label}
              <span className="tabular-ticker text-muted">{bids === null ? "–" : bids.filter((b) => inTab(t, b)).length}</span>
            </>
          ),
        }))}
      />

      {bids === null ? (
        <Card className="px-5 py-8 text-center text-sm text-muted">Loading…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="You haven't bid on anything yet"
          body="Browse live auctions and place your first bid."
          actionLabel="Browse auctions"
          actionHref="/"
          actionIcon={Search}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[13px] text-muted">
                  <th className="px-5 py-3 font-normal">Item</th>
                  <th className="px-3 py-3 font-normal">Placed</th>
                  <th className="px-3 py-3 font-normal">Status</th>
                  <th className="px-3 py-3 text-right font-normal">Amount</th>
                  <th className="w-10 px-3 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bid) => {
                  const item = items[bid.itemId];
                  const auctionId = getAuctionForItem(bid.itemId);
                  const href = auctionId ? `/auctions/${auctionId}/items/${bid.itemId}` : null;
                  return (
                    <tr
                      key={bid.id}
                      onClick={href ? () => router.push(href) : undefined}
                      className={`border-b border-line last:border-b-0 ${href ? "cursor-pointer hover:bg-subtle" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        {href ? (
                          <Link
                            href={href}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-fg hover:underline"
                          >
                            {item?.title ?? "Item"}
                          </Link>
                        ) : (
                          <span className="font-medium text-fg">{item?.title ?? "Item"}</span>
                        )}
                        {bid.statusDescription && bid.status === "REJECTED" && (
                          <span className="mt-0.5 block text-[13px] text-danger">{bid.statusDescription}</span>
                        )}
                      </td>
                      <td className="tabular-ticker whitespace-nowrap px-3 py-3.5 text-muted">
                        {formatDateTime(bid.placedAt)}
                      </td>
                      <td className="px-3 py-3.5">
                        <BidStatusPill status={bid.status} />
                      </td>
                      <td className="tabular-ticker px-3 py-3.5 text-right font-medium text-fg">
                        {formatMoney(bid.amount)}
                      </td>
                      <td className="px-3 py-3.5 text-faint">{href && <ChevronRight className="h-4 w-4" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

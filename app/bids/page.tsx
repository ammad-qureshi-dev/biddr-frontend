"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Badge, bidStatusVariant } from "@/app/components/ui/Badge";
import { BidStatus } from "@/app/lib/api";
import { Card } from "@/app/components/ui/Card";
import { AppShell } from "@/app/components/AppShell";

type Bid = {
  id: string;
  itemId: string;
  itemName: string;
  amount: number;
  status: BidStatus | null;
  placedAt: string;
  expiresAt?: string;
};

export default function MyBidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMyBids()
      .then(setBids)
      .catch(() => setError("Could not load your bids."))
      .finally(() => setLoading(false));
  }, []);

  function statusLabel(bid: Bid) {
    if (bid.status === "WINNER") return "Won";
    if (bid.status === "REJECTED") return "Rejected";
    if (bid.status === "ACTIVE") return "Active";
    if (bid.status === "OUTBID") return "Outbid";
    if (bid.status === "WITHDRAWN") return "Withdrawn";
    return "Pending";
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-10 px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">My Bids</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Bids you have placed across all auctions
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {bids.length === 0 && !error ? (
          <Card className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">
              You haven&apos;t placed any bids yet.
            </p>
            <Link href="/dashboard">
              <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Browse auctions
              </span>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/items/${bid.itemId}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {bid.itemName}
                    </Link>
                    <p className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                      ${bid.amount.toFixed(2)}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <span>Placed {new Date(bid.placedAt).toLocaleString()}</span>
                      {bid.expiresAt && (
                        <span>Expires {new Date(bid.expiresAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={bidStatusVariant(bid.status)}>
                    {statusLabel(bid)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

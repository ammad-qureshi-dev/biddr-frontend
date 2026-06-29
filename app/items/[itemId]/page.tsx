"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { Badge } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { AppShell } from "@/app/components/AppShell";
import { BidStatus } from "@/app/lib/api";

type Bid = {
  id: string;
  amount: number;
  status: BidStatus | null;
  placedAt: string;
  expiresAt?: string;
};

type Item = {
  id: string;
  title: string;
  description?: string;
  minimumPrice?: number;
  highestBid: Bid | null;
  bids: Bid[];
  priceSoldAt?: number;
};

export default function ItemPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getItem(itemId).then(setItem).catch(() => setError("Could not load item."));
  }, [itemId]);

  function bidStatusLabel(status: BidStatus | null) {
    if (status === "WINNER") return "Winner";
    if (status === "REJECTED") return "Rejected";
    if (status === "ACTIVE") return "Active";
    if (status === "OUTBID") return "Outbid";
    if (status === "WITHDRAWN") return "Withdrawn";
    return "Pending";
  }

  function bidStatusVariant(status: BidStatus | null): "accepted" | "rejected" | "open" | "paused" | "default" {
    if (status === "WINNER") return "accepted";
    if (status === "REJECTED") return "rejected";
    if (status === "ACTIVE") return "open";
    if (status === "OUTBID") return "paused";
    return "default";
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Link href="/bids" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Back to my bids
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!item) {
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
          <Link
            href="/bids"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← My Bids
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {item.title}
            </h1>
            {item.priceSoldAt != null && <Badge variant="accepted">Sold</Badge>}
          </div>
          {item.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{item.description}</p>
          )}
          {item.minimumPrice != null && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Min.{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                ${item.minimumPrice.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Bids — {item.bids.length}
        </h2>

        {item.bids.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No bids yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {item.bids.map((bid) => (
              <Card key={bid.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      ${bid.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(bid.placedAt).toLocaleString()}
                      {bid.expiresAt && (
                        <> · expires {new Date(bid.expiresAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.minimumPrice != null && (() => {
                      const pct = ((bid.amount - item.minimumPrice!) / item.minimumPrice!) * 100;
                      const sign = pct >= 0 ? "+" : "";
                      const color = pct >= 0
                        ? "bg-emerald-950/60 text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
                        : "bg-red-950/60 text-red-400 ring-1 ring-inset ring-red-500/30";
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {sign}{pct.toFixed(1)}%
                        </span>
                      );
                    })()}
                    {bid.id === item.highestBid?.id && (
                      <Badge variant="open">Highest</Badge>
                    )}
                    <Badge variant={bidStatusVariant(bid.status)}>
                      {bidStatusLabel(bid.status)}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

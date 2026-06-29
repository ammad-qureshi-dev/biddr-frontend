"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { AppShell } from "@/app/components/AppShell";

type Item = {
  id: string;
  auctionId: string;
  title: string;
  description?: string;
  minimumPrice?: number;
  sold: boolean;
  bidCount: number;
};

export default function AuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [bidItem, setBidItem] = useState<Item | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidExpiresAt, setBidExpiresAt] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidPlaced, setBidPlaced] = useState(false);

  useEffect(() => {
    api
      .getAuctionItems(auctionId)
      .then((i) => {
        setItems(i);
        setItemsLoaded(true);
      })
      .catch(() =>
        setLoadError("Could not load auction. Make sure you are signed in.")
      );

    api
      .getMyAuctions()
      .then((auctions) =>
        setIsOwner(auctions.some((a) => a.id === auctionId))
      )
      .catch(() => {});
  }, [auctionId]);

  function openBid(item: Item) {
    setBidItem(item);
    setBidAmount("");
    setBidExpiresAt("");
    setBidError("");
    setBidPlaced(false);
  }

  function closeModal() {
    setBidItem(null);
    setBidPlaced(false);
  }

  async function handleBidSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bidItem) return;
    setBidError("");
    setBidLoading(true);
    try {
      await api.createBid({
        auctionId,
        itemId: bidItem.id,
        amount: parseFloat(bidAmount),
        placedAt: new Date().toISOString().replace("Z", ""),
        expiresAt: bidExpiresAt
          ? new Date(bidExpiresAt).toISOString().replace("Z", "")
          : undefined,
      });
      setBidPlaced(true);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Failed to place bid.");
    } finally {
      setBidLoading(false);
    }
  }

  if (loadError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{loadError}</p>
            <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!itemsLoaded && !loadError) {
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ← Dashboard
            </Link>
          </div>
          {isOwner && (
            <Link href={`/auctions/${auctionId}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
          )}
        </div>

        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Items — {items.length}
        </h2>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/auctions/${auctionId}/items/${item.id}`}
                      className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.sold && (
                      <Badge variant="accepted">Sold</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-400 dark:text-gray-500">
                    {item.minimumPrice != null && (
                      <span>
                        Min.{" "}
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          ${item.minimumPrice.toFixed(2)}
                        </span>
                      </span>
                    )}
                    <span>{item.bidCount} {item.bidCount === 1 ? "bid" : "bids"}</span>
                  </div>
                </div>
                {!isOwner && !item.sold && (
                  <Button onClick={() => openBid(item)} className="shrink-0">
                    Place Bid
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {bidItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            {bidPlaced ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">Bid placed!</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Your bid is now active.</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setBidPlaced(false); setBidAmount(""); setBidExpiresAt(""); }}
                    className="w-full"
                  >
                    Place another bid
                  </Button>
                  <Button onClick={closeModal} className="w-full">Done</Button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      Place a bid
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {bidItem.title}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleBidSubmit} className="flex flex-col gap-4">
                  <Input
                    label="Bid amount ($)"
                    id="bidAmount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <Input
                    label="Expires at (optional)"
                    id="bidExpires"
                    type="datetime-local"
                    value={bidExpiresAt}
                    onChange={(e) => setBidExpiresAt(e.target.value)}
                  />

                  {bidError && (
                    <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
                      {bidError}
                    </div>
                  )}

                  <Button type="submit" disabled={bidLoading} className="w-full">
                    {bidLoading ? "Placing bid…" : "Place bid"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

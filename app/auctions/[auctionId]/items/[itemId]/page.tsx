"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/api";
import { Badge } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
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

type RejectModal = { bidId: string; reason: string; loading: boolean; error: string };

export default function ItemPage() {
  const { auctionId, itemId } = useParams<{
    auctionId: string;
    itemId: string;
  }>();
  const [item, setItem] = useState<Item | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);

  useEffect(() => {
    api.getItem(itemId).then(setItem).catch(() => setError("Could not load item."));
    api.getMyAuctions()
      .then((auctions) => setIsOwner(auctions.some((a) => a.id === auctionId)))
      .catch(() => {});
  }, [itemId, auctionId]);

  function updateBidStatus(bidId: string, status: BidStatus) {
    setItem((prev) =>
      prev
        ? { ...prev, bids: prev.bids.map((b) => b.id === bidId ? { ...b, status } : b) }
        : prev
    );
  }

  async function handleAccept(bidId: string) {
    setActionError("");
    try {
      await api.acceptBid(bidId);
      updateBidStatus(bidId, "WINNER");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept bid.");
    }
  }

  function openReject(bidId: string) {
    setRejectModal({ bidId, reason: "", loading: false, error: "" });
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModal) return;
    setRejectModal((m) => m ? { ...m, loading: true, error: "" } : m);
    try {
      await api.rejectBid(rejectModal.bidId, rejectModal.reason || undefined);
      updateBidStatus(rejectModal.bidId, "REJECTED");
      setRejectModal(null);
    } catch (err) {
      setRejectModal((m) =>
        m ? { ...m, loading: false, error: err instanceof Error ? err.message : "Failed to reject bid." } : m
      );
    }
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Link href={`/auctions/${auctionId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Back to auction
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
            href={`/auctions/${auctionId}`}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← Auction
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {item.title}
            </h1>
            {item.priceSoldAt != null && <Badge variant="accepted">Sold</Badge>}
          </div>
          {item.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {item.description}
            </p>
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

        {actionError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2 mb-4">
            {actionError}
          </div>
        )}

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
                    {bid.id === item.highestBid?.id && bid.status === "ACTIVE" && (
                      <Badge variant="open">Highest</Badge>
                    )}
                    {bid.status === "WINNER" && (
                      <Badge variant="accepted">Winner</Badge>
                    )}
                    {bid.status === "REJECTED" && (
                      <Badge variant="rejected">Rejected</Badge>
                    )}
                    {bid.status === "OUTBID" && (
                      <Badge variant="paused">Outbid</Badge>
                    )}
                    {bid.status === "WITHDRAWN" && (
                      <Badge variant="closed">Withdrawn</Badge>
                    )}
                    {isOwner && bid.status === "ACTIVE" && (
                      <>
                        <Button size="sm" onClick={() => handleAccept(bid.id)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openReject(bid.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Reject bid</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reason is optional.</p>
                </div>
                <button
                  onClick={() => setRejectModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleReject} className="flex flex-col gap-4">
                <Input
                  label="Reason (optional)"
                  id="rejectReason"
                  type="text"
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal((m) => m ? { ...m, reason: e.target.value } : m)}
                  placeholder="e.g. Bid too low"
                />

                {rejectModal.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
                    {rejectModal.error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={rejectModal.loading} className="flex-1">
                    {rejectModal.loading ? "Rejecting…" : "Reject bid"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { auctionApi } from "@/lib/api";
import type { AuctionSummaryResponse } from "@/lib/types";
import { AuctionCard } from "../../components/domain/AuctionCard";
import { EmptyState } from "../../components/ui/EmptyState";

export default function MyAuctionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) auctionApi.getMyAuctions().then(setAuctions).catch(() => setAuctions([]));
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-semibold text-ink-950">My Auctions</h1>
        <Link
          href="/auctions/create"
          className="inline-flex min-h-11 items-center rounded-lg bg-brass-500 px-5 font-sans text-sm font-semibold text-ink-950 hover:bg-brass-600"
        >
          Create Auction
        </Link>
      </div>
      <div className="mt-8">
        {auctions === null ? (
          <p className="font-sans text-sm text-slate-500">Loading…</p>
        ) : auctions.length === 0 ? (
          <EmptyState
            title="You haven't created any auctions yet"
            body="List your first item and start collecting bids."
            actionLabel="Create an auction"
            actionHref="/auctions/create"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {auctions.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

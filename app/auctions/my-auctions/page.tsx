"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auctionApi } from "@/lib/api";
import type { AuctionSummaryResponse } from "@/lib/types";
import { AuctionCard } from "../../components/domain/AuctionCard";
import { EmptyState } from "../../components/ui/EmptyState";

const PAGE_SIZE = 25;

export default function MyAuctionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    auctionApi
      .getMyAuctions({ page: 0, size: PAGE_SIZE })
      .then((res) => {
        setAuctions(res.content);
        setPage(0);
        setHasNext(res.hasNext);
      })
      .catch(() => {
        setAuctions([]);
        setHasNext(false);
      });
  }, [user]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    auctionApi
      .getMyAuctions({ page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setAuctions((prev) => [...(prev ?? []), ...res.content]);
        setPage(nextPage);
        setHasNext(res.hasNext);
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasNext, page]);

  // Fires once the card halfway through the currently loaded grid scrolls into the
  // viewport, so the next page arrives before the user reaches the actual bottom.
  const [midpointEl, setMidpointEl] = useState<HTMLDivElement | null>(null);
  const midpointIndex = auctions ? Math.floor(auctions.length / 2) : -1;

  useEffect(() => {
    if (!midpointEl) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    });
    observer.observe(midpointEl);
    return () => observer.disconnect();
  }, [midpointEl, loadMore]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-semibold text-ink-950">My Auctions</h1>
        <Link
          href="/auctions/create"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brass-500 px-5 font-sans text-sm font-semibold text-white hover:bg-brass-600"
        >
          <Plus className="h-4 w-4" />
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
            actionIcon={Plus}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {auctions.map((a, i) => (
                <div key={a.id} ref={i === midpointIndex ? setMidpointEl : undefined}>
                  <AuctionCard auction={a} />
                </div>
              ))}
            </div>
            {loadingMore && (
              <p className="py-6 text-center font-sans text-sm text-slate-500">Loading more…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

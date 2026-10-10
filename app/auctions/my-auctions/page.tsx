"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auctionApi } from "@/lib/api";
import type { AuctionSummaryResponse } from "@/lib/types";
import { loginHref } from "@/lib/next-url";
import { AuctionTable } from "../../components/domain/AuctionTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Card } from "../../components/ui/Card";
import { LinkButton } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";

const PAGE_SIZE = 25;

export default function MyAuctionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push(loginHref("/auctions/my-auctions"));
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    auctionApi
      .getMyAuctions({ page: 0, size: PAGE_SIZE })
      .then((res) => {
        setAuctions(res.content);
        setTotal(res.totalElements);
        setPage(0);
        setHasNext(res.hasNext);
      })
      .catch(() => {
        setAuctions([]);
        setHasNext(false);
      });
  }, [user]);

  // A ref, not the `loadingMore` state, guards against re-entrancy: the IntersectionObserver
  // below can fire again (e.g. re-observing the same still-visible element on mount) before a
  // state update from the previous call has committed and `loadMore` has been recreated with
  // a fresh closure — a stale `loadingMore` read would let the same page be fetched twice.
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasNext) return;
    loadingRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    auctionApi
      .getMyAuctions({ page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setAuctions((prev) => {
          const seen = new Set((prev ?? []).map((a) => a.id));
          return [...(prev ?? []), ...res.content.filter((a) => !seen.has(a.id))];
        });
        setPage(nextPage);
        setHasNext(res.hasNext);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoadingMore(false);
      });
  }, [hasNext, page]);

  // Fires once the row halfway through the currently loaded table scrolls into the
  // viewport, so the next page arrives before the user reaches the actual bottom.
  const [midpointEl, setMidpointEl] = useState<HTMLTableRowElement | null>(null);
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Auctions"
        description="Auctions you've created and manage."
        actions={
          <LinkButton href="/auctions/create" icon={Plus}>
            Create Auction
          </LinkButton>
        }
      />

      {auctions === null ? (
        <Card className="px-5 py-8 text-center text-sm text-muted">Loading…</Card>
      ) : auctions.length === 0 ? (
        <EmptyState
          title="You haven't created any auctions yet"
          body="List your first item and start collecting bids."
          actionLabel="Create an auction"
          actionHref="/auctions/create"
          actionIcon={Plus}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 pb-3 pt-5">
            <h2 className="text-[17px] font-semibold text-fg">All auctions</h2>
            <span className="tabular-ticker text-[13px] text-muted">{total} total</span>
          </div>
          <AuctionTable auctions={auctions} rowRef={{ index: midpointIndex, ref: setMidpointEl }} />
          {loadingMore && <p className="border-t border-line py-3 text-center text-sm text-muted">Loading more…</p>}
        </Card>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auctionApi } from "@/lib/api";
import type { AuctionSummaryResponse } from "@/lib/types";
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
    if (!loading && !user) router.push("/login");
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

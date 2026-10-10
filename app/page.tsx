"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auctionApi } from "@/lib/api";
import type { AuctionStatus, AuctionSummaryResponse } from "@/lib/types";
import { AuctionCard } from "./components/domain/AuctionCard";
import { EmptyState } from "./components/ui/EmptyState";
import { PageHeader } from "./components/ui/PageHeader";
import { Segmented } from "./components/ui/Segmented";

const PAGE_SIZE = 25;

const STATUS_OPTIONS: { value: AuctionStatus | ""; label: React.ReactNode }[] = [
  { value: "", label: "All" },
  {
    value: "LIVE",
    label: "Live now",
  },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "PAUSED", label: "Paused" },
  { value: "CLOSED", label: "Closed" },
];

function BrowseContent() {
  // The title search lives in the top bar and is mirrored into `?q=`.
  const title = useSearchParams().get("q") ?? "";
  const [status, setStatus] = useState<AuctionStatus | "">("");
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function run() {
      setAuctions(null);
      try {
        const res = await auctionApi.search({
          title: title || undefined,
          status: status || undefined,
          page: 0,
          size: PAGE_SIZE,
        });
        setAuctions(res.content);
        setTotal(res.totalElements);
        setPage(0);
        setHasNext(res.hasNext);
      } catch {
        setAuctions([]);
        setTotal(0);
        setHasNext(false);
      }
    }
    run();
  }, [title, status]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    auctionApi
      .search({ title: title || undefined, status: status || undefined, page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setAuctions((prev) => [...(prev ?? []), ...res.content]);
        setPage(nextPage);
        setHasNext(res.hasNext);
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasNext, page, title, status]);

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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <>
            Live &amp; upcoming <span className="font-serif text-[1.12em] font-normal italic">auctions</span>
          </>
        }
        description="Bid with confidence on goods, vehicles, and real estate."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter by status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        <span className="text-sm text-muted">
          {total === null ? (
            "Loading…"
          ) : (
            <>
              <span className="tabular-ticker text-fg">{total}</span>{" "}
              {total === 1 ? "auction" : "auctions"}
              {title && (
                <>
                  {" "}
                  matching &ldquo;<span className="text-fg">{title}</span>&rdquo;
                </>
              )}
            </>
          )}
        </span>
      </div>

      {auctions === null ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-subtle" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          title="No auctions found"
          body="Try a different search or check back soon for new listings."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {auctions.map((a, i) => (
              <div key={a.id} ref={i === midpointIndex ? setMidpointEl : undefined}>
                <AuctionCard auction={a} />
              </div>
            ))}
          </div>
          {loadingMore && <p className="py-4 text-center text-sm text-muted">Loading more…</p>}
        </>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  );
}

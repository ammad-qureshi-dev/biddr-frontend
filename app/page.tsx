"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { auctionApi } from "@/lib/api";
import type { AuctionStatus, AuctionSummaryResponse } from "@/lib/types";
import { AuctionCard } from "./components/domain/AuctionCard";
import { EmptyState } from "./components/ui/EmptyState";

const PAGE_SIZE = 25;

export default function BrowsePage() {
  const [title, setTitle] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const [status, setStatus] = useState<AuctionStatus | "">("");
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const effectiveStatus = liveOnly ? "LIVE" : status || undefined;

  useEffect(() => {
    async function run() {
      setAuctions(null);
      try {
        const res = await auctionApi.search({
          title: title || undefined,
          status: effectiveStatus,
          page: 0,
          size: PAGE_SIZE,
        });
        setAuctions(res.content);
        setPage(0);
        setHasNext(res.hasNext);
      } catch {
        setAuctions([]);
        setHasNext(false);
      }
    }
    run();
    // effectiveStatus is derived from liveOnly/status, both already tracked below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, liveOnly, status]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    auctionApi
      .search({ title: title || undefined, status: effectiveStatus, page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setAuctions((prev) => [...(prev ?? []), ...res.content]);
        setPage(nextPage);
        setHasNext(res.hasNext);
      })
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasNext, page, title, effectiveStatus]);

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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-4xl font-semibold text-ink-950">
          Live &amp; upcoming auctions
        </h1>
        <p className="mt-1 font-sans text-sm text-slate-500">
          Bid with confidence: goods, vehicles, and real estate
        </p>
      </div>

      <div className="sticky top-16 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-paper-50 px-6 py-4">
        <button
          onClick={() => setLiveOnly((v) => !v)}
          aria-pressed={liveOnly}
          className={`flex min-h-9 items-center gap-1.5 rounded-full border px-4 font-sans text-sm font-semibold transition-colors ${liveOnly
              ? "border-ledger-green bg-ledger-green text-white"
              : "border-slate-200 bg-paper-100 text-ink-950"
            }`}
        >
          <Zap className="h-4 w-4" />
          Live now
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Search auctions…"
          className="min-h-9 flex-1 min-w-[200px] rounded-full border border-slate-200 bg-paper-100 px-4 font-sans text-sm text-ink-950 outline-none focus:border-2 focus:border-ink-950"
        />
        <select
          value={status}
          disabled={liveOnly}
          onChange={(e) => setStatus(e.target.value as AuctionStatus | "")}
          className="min-h-9 rounded-full border border-slate-200 bg-paper-100 px-4 font-sans text-sm text-ink-950 outline-none disabled:opacity-50"
        >
          <option value="">Any status</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="LIVE">Live</option>
          <option value="PAUSED">Paused</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="mt-8">
        {auctions === null ? (
          <p className="font-sans text-sm text-slate-500">Loading auctions…</p>
        ) : auctions.length === 0 ? (
          <EmptyState
            title="No auctions found"
            body="Try a different search or check back soon for new listings."
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

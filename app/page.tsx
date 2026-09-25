"use client";

import { useEffect, useState } from "react";
import { auctionApi } from "@/lib/api";
import type { AuctionStatus, AuctionSummaryResponse } from "@/lib/types";
import { AuctionCard } from "./components/domain/AuctionCard";
import { EmptyState } from "./components/ui/EmptyState";

export default function BrowsePage() {
  const [title, setTitle] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const [status, setStatus] = useState<AuctionStatus | "">("");
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);

  useEffect(() => {
    const effectiveStatus = liveOnly ? "LIVE" : status || undefined;
    auctionApi
      .search({ title: title || undefined, status: effectiveStatus })
      .then(setAuctions)
      .catch(() => setAuctions([]));
  }, [title, liveOnly, status]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-4xl font-semibold text-ink-950">
          Live &amp; upcoming auctions
        </h1>
        <p className="mt-1 font-sans text-sm text-slate-500">
          Goods, vehicles, and real estate — bid with confidence.
        </p>
      </div>

      <div className="sticky top-16 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-paper-50 px-6 py-4">
        <button
          onClick={() => setLiveOnly((v) => !v)}
          aria-pressed={liveOnly}
          className={`min-h-9 rounded-full border px-4 font-sans text-sm font-semibold transition-colors ${
            liveOnly
              ? "border-ledger-green bg-ledger-green text-white"
              : "border-slate-200 bg-paper-100 text-ink-950"
          }`}
        >
          Live now
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Search auctions…"
          className="min-h-9 flex-1 min-w-[200px] rounded-lg border border-slate-200 bg-paper-100 px-3 font-sans text-sm text-ink-950 outline-none focus:border-2 focus:border-brass-500"
        />
        <select
          value={status}
          disabled={liveOnly}
          onChange={(e) => setStatus(e.target.value as AuctionStatus | "")}
          className="min-h-9 rounded-lg border border-slate-200 bg-paper-100 px-3 font-sans text-sm text-ink-950 outline-none disabled:opacity-50"
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

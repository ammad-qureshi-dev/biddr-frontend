"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auctionApi } from "@/lib/api";
import type { AuctionSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { EmptyState } from "../components/ui/EmptyState";

type SortKey = "title" | "startTime" | "itemCount";

export default function ResultsPage() {
  const [auctions, setAuctions] = useState<AuctionSummaryResponse[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("startTime");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    auctionApi
      .search({ status: "CLOSED" })
      .then(setAuctions)
      .catch(() => setAuctions([]));
  }, []);

  const sorted = useMemo(() => {
    if (!auctions) return [];
    const copy = [...auctions];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      if (sortKey === "startTime") cmp = a.startTime.localeCompare(b.startTime);
      if (sortKey === "itemCount") cmp = a.itemCount - b.itemCount;
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [auctions, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc((d) => !d);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const totalLots = auctions?.reduce((sum, a) => sum + a.itemCount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-950">Results</h1>
      <p className="mt-1 font-sans text-sm text-slate-500">Closed auctions.</p>

      <div className="mt-6 flex gap-10 border-y border-slate-200 py-5">
        <div>
          <span className="tabular-ticker text-3xl font-semibold text-ink-950">
            {auctions?.length ?? "—"}
          </span>
          <p className="font-sans text-xs uppercase tracking-wide text-slate-500">
            Auctions closed
          </p>
        </div>
        <div>
          <span className="tabular-ticker text-3xl font-semibold text-ink-950">{totalLots}</span>
          <p className="font-sans text-xs uppercase tracking-wide text-slate-500">Total lots</p>
        </div>
      </div>

      <div className="mt-6">
        {auctions === null ? (
          <p className="font-sans text-sm text-slate-500">Loading…</p>
        ) : sorted.length === 0 ? (
          <EmptyState title="No closed auctions yet" body="Results appear here once auctions close." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <SortableHeader label="Title" active={sortKey === "title"} desc={sortDesc} onClick={() => toggleSort("title")} />
                  <SortableHeader label="Items" active={sortKey === "itemCount"} desc={sortDesc} onClick={() => toggleSort("itemCount")} />
                  <th className="py-2 font-medium">Categories</th>
                  <SortableHeader label="Closed" active={sortKey === "startTime"} desc={sortDesc} onClick={() => toggleSort("startTime")} />
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => (
                  <tr key={a.id} className="border-b border-slate-200/60 hover:bg-paper-100">
                    <td className="py-3">
                      <Link href={`/auctions/${a.id}`} className="font-medium text-ink-950 hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="tabular-ticker py-3">{a.itemCount}</td>
                    <td className="py-3 text-slate-500">
                      {a.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
                    </td>
                    <td className="tabular-ticker py-3 text-slate-500">{formatDate(a.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  desc,
  onClick,
}: {
  label: string;
  active: boolean;
  desc: boolean;
  onClick: () => void;
}) {
  return (
    <th className="py-2 font-medium">
      <button onClick={onClick} className="flex items-center gap-1 hover:text-ink-950">
        {label}
        {active && <span>{desc ? "↓" : "↑"}</span>}
      </button>
    </th>
  );
}

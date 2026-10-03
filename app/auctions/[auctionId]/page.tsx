"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Play, Pause, Lock, X, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { auctionApi, ApiError } from "@/lib/api";
import type { AuctionResponse, AuctionStatus, ItemSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { AuctionStatusPill } from "../../components/domain/StatusPills";
import { CountdownTimer } from "../../components/domain/CountdownTimer";
import { ItemCard } from "../../components/domain/ItemCard";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { rememberItemAuction } from "@/lib/item-auction-cache";

const NEXT_STATUS: Record<AuctionStatus, AuctionStatus[]> = {
  UPCOMING: ["LIVE", "PAUSED"],
  LIVE: ["PAUSED", "CLOSED"],
  PAUSED: ["LIVE", "CLOSED"],
  CLOSED: [],
};

const STATUS_LABEL: Record<AuctionStatus, string> = {
  UPCOMING: "Upcoming",
  LIVE: "Live",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

const STATUS_ICON: Partial<Record<AuctionStatus, typeof Play>> = {
  LIVE: Play,
  PAUSED: Pause,
};

export default function AuctionDetailPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [items, setItems] = useState<ItemSummaryResponse[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    auctionApi.getById(auctionId).then(setAuction).catch(() => setNotFound(true));
    auctionApi
      .getItems(auctionId)
      .then((fetched) => {
        setItems(fetched);
        fetched.forEach((it) => rememberItemAuction(it.id, auctionId));
      })
      .catch(() => setItems([]));
  }, [auctionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <EmptyState
          title="Auction not found"
          body="This auction may have been removed or the link is incorrect."
          actionLabel="Browse auctions"
          actionHref="/"
          actionIcon={Search}
        />
      </div>
    );
  }

  if (!auction || !items) {
    return <div className="mx-auto max-w-6xl px-6 py-16 font-sans text-sm text-slate-500">Loading…</div>;
  }

  const isOwner = user?.id === auction.ownerId;

  async function changeStatus(status: AuctionStatus) {
    setBusy(true);
    try {
      await auctionApi.updateStatus(auctionId, status);
      showToast(`Auction marked ${STATUS_LABEL[status].toLowerCase()}.`);
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
      setConfirmClose(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <AuctionStatusPill status={auction.auctionStatus} />
            <span className="font-sans text-xs uppercase tracking-wide text-slate-500">
              {formatDateTime(auction.startTime)} — {formatDateTime(auction.endTime)}
            </span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-950">{auction.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {auction.categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-slate-200/60 px-2.5 py-0.5 font-sans text-xs text-slate-500"
              >
                {CATEGORY_LABELS[c]}
              </span>
            ))}
          </div>
        </div>

        {(auction.auctionStatus === "LIVE" || auction.auctionStatus === "UPCOMING") && (
          <div className="flex flex-col items-end gap-1">
            <span className="font-sans text-xs uppercase tracking-wide text-slate-500">
              {auction.auctionStatus === "LIVE" ? "Closes in" : "Starts in"}
            </span>
            <CountdownTimer
              target={auction.auctionStatus === "LIVE" ? auction.endTime : auction.startTime}
              size="lg"
            />
          </div>
        )}
      </div>

      {isOwner && auction.auctionStatus !== "CLOSED" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-paper-100 px-4 py-3">
          <span className="font-sans text-xs font-semibold uppercase text-slate-500">
            Owner controls
          </span>
          <Link href={`/auctions/${auctionId}/edit`}>
            <Button variant="secondary" icon={Pencil}>
              Edit
            </Button>
          </Link>
          {NEXT_STATUS[auction.auctionStatus].map((status) =>
            status === "CLOSED" ? (
              <Button
                key={status}
                variant="secondary"
                icon={Lock}
                disabled={busy}
                onClick={() => setConfirmClose(true)}
              >
                Close auction
              </Button>
            ) : (
              <Button
                key={status}
                variant="secondary"
                icon={STATUS_ICON[status]}
                disabled={busy}
                onClick={() => changeStatus(status)}
              >
                Mark {STATUS_LABEL[status]}
              </Button>
            ),
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink-950">Items</h2>
        {items.length === 0 ? (
          <EmptyState title="No items yet" body="This auction has no items." />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} auctionId={auctionId} />
            ))}
          </div>
        )}
      </div>

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} title="Close this auction?">
        <p className="font-sans text-sm text-slate-500">
          This finalizes the highest bid on every item and notifies the winners. This can&apos;t be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="tertiary" icon={X} onClick={() => setConfirmClose(false)}>
            Cancel
          </Button>
          <Button icon={Lock} disabled={busy} onClick={() => changeStatus("CLOSED")}>
            Close auction
          </Button>
        </div>
      </Modal>
    </div>
  );
}

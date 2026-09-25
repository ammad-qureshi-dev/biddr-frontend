"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { useSlimNav } from "@/lib/chrome-context";
import { rememberItemAuction } from "@/lib/item-auction-cache";
import { auctionApi, itemApi, bidApi, ApiError } from "@/lib/api";
import type { AuctionResponse, BidSummaryResponse, ItemResponse } from "@/lib/types";
import { BidAmountDisplay } from "../../../../components/domain/BidAmountDisplay";
import { CountdownTimer } from "../../../../components/domain/CountdownTimer";
import { BidInput } from "../../../../components/domain/BidInput";
import { BidList } from "../../../../components/domain/BidList";
import { Button } from "../../../../components/ui/Button";
import { Modal } from "../../../../components/ui/Modal";
import { Textarea } from "../../../../components/ui/Input";

export default function ItemDetailPage() {
  const { auctionId, itemId } = useParams<{ auctionId: string; itemId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [item, setItem] = useState<ItemResponse | null>(null);
  const [bids, setBids] = useState<BidSummaryResponse[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    auctionApi.getById(auctionId).then(setAuction).catch(() => setNotFound(true));
    itemApi.getById(itemId).then(setItem).catch(() => setNotFound(true));
    bidApi.getForItem(itemId).then(setBids).catch(() => setBids([]));
    rememberItemAuction(itemId, auctionId);
  }, [auctionId, itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const isLive = auction?.auctionStatus === "LIVE";
  useSlimNav(isLive ?? false);

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center font-sans text-sm text-slate-500">
        Item not found.{" "}
        <Link href={`/auctions/${auctionId}`} className="text-brass-600 hover:underline">
          Back to auction
        </Link>
      </div>
    );
  }

  if (!auction || !item) {
    return <div className="mx-auto max-w-6xl px-6 py-16 font-sans text-sm text-slate-500">Loading…</div>;
  }

  const isOwner = user?.id === auction.ownerId;
  const currentHighestBid = bids.find((b) => b.id === item.highestBidId) ?? null;
  const myBid = user ? bids.find((b) => b.bidderId === user.id) : undefined;
  const bidState: "default" | "winning" | "outbid" =
    user && currentHighestBid?.bidderId === user.id
      ? "winning"
      : myBid?.status === "OUTBID"
        ? "outbid"
        : "default";

  const canBid = !!user && !isOwner && isLive;
  const bidDisabledReason = !user
    ? "Sign in to place a bid."
    : isOwner
      ? "You can't bid on your own auction."
      : !isLive
        ? "Bidding opens once the auction is live."
        : undefined;

  const canAccept =
    isOwner && currentHighestBid?.status === "ACTIVE" && auction.auctionStatus !== "CLOSED";
  const canReject =
    isOwner && currentHighestBid && currentHighestBid.status === "ACTIVE";

  async function handleBid(amount: number) {
    try {
      const bidId = await bidApi.create({ auctionId, itemId, amount });
      const result = await bidApi.searchByIds([bidId]);
      const placed = result.data?.[0];
      if (placed?.status === "REJECTED") {
        showToast(placed.statusDescription ?? "Your bid wasn't accepted.", "error");
      } else {
        showToast("Bid placed — you're the highest bidder.");
      }
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    }
  }

  async function handleAccept() {
    if (!currentHighestBid) return;
    setBusy(true);
    try {
      const accepted = await bidApi.accept(currentHighestBid.id);
      if (accepted) {
        showToast("Bid accepted.");
        load();
      } else {
        showToast("You can't accept your own bid.", "error");
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusy(true);
    try {
      await bidApi.reject(rejectTarget, rejectReason);
      showToast("Bid rejected.");
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  const ownerActions = (canAccept || canReject) && (
    <div className="flex gap-3">
      {canAccept && (
        <Button disabled={busy} onClick={handleAccept}>
          Accept bid
        </Button>
      )}
      {canReject && (
        <Button variant="secondary" disabled={busy} onClick={() => setRejectTarget(currentHighestBid!.id)}>
          Reject bid
        </Button>
      )}
    </div>
  );

  if (isLive) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-ink-950 text-paper-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 pt-6">
          <Link href={`/auctions/${auctionId}`} className="font-sans text-xs text-slate-200 hover:text-brass-500">
            ← {auction.title}
          </Link>
          <h1 className="font-display text-3xl font-semibold">{item.title}</h1>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="font-sans text-xs uppercase tracking-widest text-slate-200">
                Closes in
              </span>
              <CountdownTimer target={auction.endTime} size="lg" onDark />
            </div>
            <BidAmountDisplay
              amount={item.highestBidAmount}
              state={bidState}
              bidCount={bids.length}
              reserveMet={item.minimumPrice !== null ? item.highestBidAmount !== null : undefined}
              size="lg"
              onDark
            />
            {ownerActions}
            {canBid && (
              <div className="w-full max-w-xs">
                <BidInput
                  currentHighest={item.highestBidAmount}
                  minimumPrice={item.minimumPrice}
                  onSubmit={handleBid}
                />
              </div>
            )}
            {!canBid && bidDisabledReason && (
              <p className="font-sans text-sm text-slate-200">{bidDisabledReason}</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-ink-800 p-5">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-200">
              Live activity
            </h2>
            <div className="mt-4">
              <BidList bids={bids} currentUserId={user?.id} variant="ticker" />
            </div>
          </div>
        </div>

        <RejectModal
          open={!!rejectTarget}
          reason={rejectReason}
          setReason={setRejectReason}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          busy={busy}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href={`/auctions/${auctionId}`} className="font-sans text-xs text-slate-500 hover:text-brass-500">
        ← {auction.title}
      </Link>
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-slate-200 bg-paper-100">
          <span className="font-display text-6xl text-slate-200">
            {item.title.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink-950">{item.title}</h1>
            <p className="mt-2 font-sans text-sm text-slate-500">{item.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-paper-100 p-5">
            <BidAmountDisplay
              amount={item.highestBidAmount}
              state={bidState}
              bidCount={bids.length}
              reserveMet={item.minimumPrice !== null ? item.highestBidAmount !== null : undefined}
            />
            {(auction.auctionStatus === "LIVE" || auction.auctionStatus === "UPCOMING") && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-sans text-xs uppercase tracking-wide text-slate-500">
                  {auction.auctionStatus === "LIVE" ? "Closes in" : "Starts in"}
                </span>
                <CountdownTimer
                  target={auction.auctionStatus === "LIVE" ? auction.endTime : auction.startTime}
                />
              </div>
            )}
            {ownerActions && <div className="mt-4 border-t border-slate-200 pt-4">{ownerActions}</div>}
            {canBid ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <BidInput
                  currentHighest={item.highestBidAmount}
                  minimumPrice={item.minimumPrice}
                  onSubmit={handleBid}
                />
              </div>
            ) : (
              bidDisabledReason && (
                <p className="mt-4 border-t border-slate-200 pt-4 font-sans text-sm text-slate-500">
                  {bidDisabledReason}
                </p>
              )
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-ink-950">Bid history</h2>
            <div className="mt-3">
              <BidList bids={bids} currentUserId={user?.id} />
            </div>
          </div>
        </div>
      </div>

      <RejectModal
        open={!!rejectTarget}
        reason={rejectReason}
        setReason={setRejectReason}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        busy={busy}
      />
    </div>
  );
}

function RejectModal({
  open,
  reason,
  setReason,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  reason: string;
  setReason: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Reject this bid">
      <Textarea
        id="rejectReason"
        label="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. insufficient funds"
      />
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="tertiary" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={busy || !reason.trim()} onClick={onConfirm}>
          Reject bid
        </Button>
      </div>
    </Modal>
  );
}

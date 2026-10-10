"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, X, Ban } from "lucide-react";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
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
import { Card } from "../../../../components/ui/Card";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { AuctionStatusPill } from "../../../../components/domain/StatusPills";

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
    bidApi.getTopTenForItem(itemId).then(setBids).catch(() => setBids([]));
    rememberItemAuction(itemId, auctionId);
  }, [auctionId, itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const isLive = auction?.auctionStatus === "LIVE";

  if (notFound) {
    return (
      <div className="py-16 text-center text-sm text-muted">
        Item not found.{" "}
        <Link href={`/auctions/${auctionId}`} className="font-medium text-fg underline">
          Back to auction
        </Link>
      </div>
    );
  }

  if (!auction || !item) {
    return <div className="py-16 text-center text-sm text-muted">Loading…</div>;
  }

  const isOwner = user?.id === auction.ownerId;
  // Bidding-service is the source of truth for the leading bid: after a rejection it promotes
  // the next bid to ACTIVE but never updates catalog's cached item.highestBidId/highestBidAmount.
  const currentHighestBid = bids.find((b) => b.status === "ACTIVE" || b.status === "WINNER") ?? null;
  const leadingAmount = bids.length > 0 ? (currentHighestBid?.amount ?? null) : item.highestBidAmount;
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
      const bidId = await bidApi.create({ auctionId, itemId, itemName: item!.title, amount });
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
      await bidApi.reject(rejectTarget, item!.title, rejectReason);
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
    <div className="flex flex-wrap gap-2">
      {canAccept && (
        <Button icon={Check} disabled={busy} onClick={handleAccept}>
          Accept bid
        </Button>
      )}
      {canReject && (
        <Button
          variant="secondary"
          icon={Ban}
          disabled={busy}
          onClick={() => setRejectTarget(currentHighestBid!.id)}
        >
          Reject bid
        </Button>
      )}
    </div>
  );

  const facts: { label: string; value: React.ReactNode }[] = [
    {
      label: "Reserve price",
      value: item.minimumPrice !== null ? formatMoney(item.minimumPrice) : <span className="text-faint">None</span>,
    },
    { label: "Auction starts", value: formatDateTime(auction.startTime) },
    { label: "Auction ends", value: formatDateTime(auction.endTime) },
    { label: "Bids shown", value: bids.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: `/auctions/${auctionId}`, label: auction.title }}
        meta={<AuctionStatusPill status={auction.auctionStatus} />}
        title={item.title}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <Card className="p-5">
            <h2 className="text-[17px] font-semibold text-fg">Details</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">
              {item.description || "No description provided."}
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="rounded-xl bg-subtle px-4 py-3">
                  <dt className="text-[13px] text-muted">{f.label}</dt>
                  <dd className="tabular-ticker mt-0.5 text-[15px] font-medium text-fg">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 pb-3 pt-5">
              <h2 className="text-[17px] font-semibold text-fg">Top bids</h2>
              <span className="text-[13px] text-muted">Highest 10</span>
            </div>
            <BidList bids={bids} currentUserId={user?.id} />
          </Card>
        </div>

        <Card className="order-1 p-5 lg:sticky lg:top-28 lg:order-2">
          {isLive && (
            <div className="mb-4 flex items-center gap-1.5 text-[13px] text-fg">
              <span className="h-1.5 w-1.5 animate-pulse-urgent rounded-full bg-success" />
              Live now
            </div>
          )}
          <BidAmountDisplay
            amount={leadingAmount}
            state={bidState}
            bidCount={bids.length}
            reserveMet={item.minimumPrice !== null ? leadingAmount !== null : undefined}
          />
          {(auction.auctionStatus === "LIVE" || auction.auctionStatus === "UPCOMING") && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-subtle px-4 py-3">
              <span className="text-[13px] text-muted">
                {auction.auctionStatus === "LIVE" ? "Closes in" : "Starts in"}
              </span>
              <CountdownTimer target={auction.auctionStatus === "LIVE" ? auction.endTime : auction.startTime} />
            </div>
          )}
          {ownerActions && <div className="mt-5 border-t border-line pt-5">{ownerActions}</div>}
          {canBid ? (
            <div className="mt-5 border-t border-line pt-5">
              <BidInput currentHighest={leadingAmount} minimumPrice={item.minimumPrice} onSubmit={handleBid} />
            </div>
          ) : (
            bidDisabledReason && (
              <p className="mt-5 border-t border-line pt-5 text-sm text-muted">{bidDisabledReason}</p>
            )
          )}
        </Card>
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
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" icon={X} onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Ban} disabled={busy || !reason.trim()} onClick={onConfirm}>
          Reject bid
        </Button>
      </div>
    </Modal>
  );
}

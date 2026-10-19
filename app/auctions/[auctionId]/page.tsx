"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock, Pause, Pencil, Play, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { auctionApi, ApiError } from "@/lib/api";
import type { AuctionResponse, AuctionStatus, ItemSummaryResponse } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { formatDateTime, formatMoney, formatPickupRegion, formatPickupStreet } from "@/lib/format";
import { AuctionStatusPill, ItemSoldBadge } from "../../components/domain/StatusPills";
import { CountdownTimer } from "../../components/domain/CountdownTimer";
import { Button, LinkButton } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
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

/** One cell of the compact auction summary strip: label over a single-line value. */
function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-5 py-3.5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="tabular-ticker mt-0.5 truncate text-[15px] font-medium text-fg">{value}</p>
    </div>
  );
}

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

  // Only the first load counts as a view; the refresh after a status change doesn't.
  const load = useCallback((countView = false) => {
    (countView ? auctionApi.view : auctionApi.getById)(auctionId).then(setAuction).catch(() => setNotFound(true));
    auctionApi
      .getItems(auctionId)
      .then((fetched) => {
        setItems(fetched);
        fetched.forEach((it) => rememberItemAuction(it.id, auctionId));
      })
      .catch(() => setItems([]));
  }, [auctionId]);

  useEffect(() => {
    load(true);
  }, [load]);

  if (notFound) {
    return (
      <div className="py-6">
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
    return <div className="py-16 text-center text-sm text-muted">Loading…</div>;
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

  const isRunning = auction.auctionStatus === "LIVE" || auction.auctionStatus === "UPCOMING";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/", label: "All auctions" }}
        meta={
          <>
            <AuctionStatusPill status={auction.auctionStatus} />
            {auction.categories.length > 0 && (
              <span className="text-[13px] text-muted">
                {auction.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
              </span>
            )}
          </>
        }
        title={auction.title}
        actions={
          isOwner &&
          auction.auctionStatus !== "CLOSED" && (
            <>
              <LinkButton href={`/auctions/${auctionId}/edit`} variant="secondary" icon={Pencil}>
                Edit
              </LinkButton>
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
            </>
          )
        }
      />

      {/* 1px gaps over a `line` background draw the dividers between cells at any column count. */}
      <Card
        className={`grid gap-px overflow-hidden bg-line ${isRunning ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}
      >
        {/* Status is already shown above the title, so the first cell only appears when there's a countdown. */}
        {isRunning && (
          <SummaryItem
            label={auction.auctionStatus === "LIVE" ? "Closes in" : "Starts in"}
            value={
              <CountdownTimer
                target={auction.auctionStatus === "LIVE" ? auction.endTime : auction.startTime}
                size="sm"
              />
            }
          />
        )}
        <SummaryItem
          label="Items"
          value={
            <>
              {items.length}
              <span className="font-normal text-muted"> · {items.filter((it) => it.sold).length} sold</span>
            </>
          }
        />
        <SummaryItem label="Starts" value={formatDateTime(auction.startTime)} />
        <SummaryItem label="Ends" value={formatDateTime(auction.endTime)} />
      </Card>

      <Card className="p-5">
        <h2 className="text-[17px] font-semibold text-fg">Pickup information</h2>
        {auction.pickupLocation ? (
          <>
            <address className="mt-2 text-[15px] not-italic leading-relaxed text-fg">
              {formatPickupStreet(auction.pickupLocation)}
              <br />
              <span className="text-muted">{formatPickupRegion(auction.pickupLocation)}</span>
            </address>
            {auction.pickupLocation.instructions && (
              <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-muted">
                {auction.pickupLocation.instructions}
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No pickup location has been added yet.
            {isOwner && auction.auctionStatus !== "CLOSED" && (
              <>
                {" "}
                <Link href={`/auctions/${auctionId}/edit`} className="text-fg underline">
                  Add one
                </Link>
              </>
            )}
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[17px] font-semibold text-fg">Items</h2>
        </div>
        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No items yet" body="This auction has no items." />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-line text-left text-[13px] text-muted">
                  <th className="px-5 py-2.5 font-normal">Item</th>
                  <th className="px-3 py-2.5 text-right font-normal">Reserve</th>
                  <th className="px-3 py-2.5 font-normal">Status</th>
                  <th className="w-10 px-3 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const href = `/auctions/${auctionId}/items/${item.id}`;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(href)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate font-medium text-fg hover:underline"
                        >
                          {item.title}
                        </Link>
                        <span className="line-clamp-1 text-[13px] text-muted">{item.description}</span>
                      </td>
                      <td className="tabular-ticker whitespace-nowrap px-3 py-3.5 text-right text-fg">
                        {item.minimumPrice !== null ? formatMoney(item.minimumPrice) : <span className="text-faint">None</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        {item.sold ? <ItemSoldBadge /> : <span className="text-[13px] text-muted">Open</span>}
                      </td>
                      <td className="px-3 py-3.5 text-faint">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={confirmClose} onClose={() => setConfirmClose(false)} title="Close this auction?">
        <p className="text-sm text-muted">
          This finalizes the highest bid on every item and notifies the winners. This can&apos;t be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" icon={X} onClick={() => setConfirmClose(false)}>
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

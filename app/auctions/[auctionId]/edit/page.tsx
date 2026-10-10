"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Plus, Save, Lock } from "lucide-react";
import { Card, CardHeader } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { auctionApi, ApiError } from "@/lib/api";
import type { AuctionCategory, AuctionResponse, ItemRequest } from "@/lib/types";
import { toLocalDateTimeInputValue, snapToQuarterHour } from "@/lib/format";
import { formatMoney } from "@/lib/format";
import { loginHref } from "@/lib/next-url";
import { Input, Textarea } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { DateTimeField } from "../../../components/ui/DateTimeField";
import { CategoryPicker } from "../../../components/domain/CategoryPicker";
import {
  PickupLocationFields,
  emptyPickupDraft,
  pickupDraftFrom,
  pickupDraftToLocation,
} from "../../../components/domain/PickupLocationFields";

const emptyItem = (): ItemRequest => ({ title: "", description: "", minimumPrice: null });

export default function EditAuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [auction, setAuction] = useState<AuctionResponse | null>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [categories, setCategories] = useState<AuctionCategory[]>([]);
  const [pickup, setPickup] = useState(emptyPickupDraft);
  const [newItems, setNewItems] = useState<ItemRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push(loginHref(`/auctions/${auctionId}/edit`));
  }, [loading, user, router, auctionId]);

  useEffect(() => {
    auctionApi
      .getById(auctionId)
      .then((a) => {
        setAuction(a);
        setTitle(a.title);
        setStartTime(new Date(a.startTime));
        setEndTime(new Date(a.endTime));
        setCategories(a.categories);
        setPickup(pickupDraftFrom(a.pickupLocation));
      })
      .catch(() => router.push(`/auctions/${auctionId}`));
  }, [auctionId]);

  useEffect(() => {
    if (auction && user && auction.ownerId !== user.id) router.push(`/auctions/${auctionId}`);
  }, [auction, user, auctionId, router]);

  if (!auction || !startTime || !endTime) {
    return <div className="py-16 text-center text-sm text-muted">Loading…</div>;
  }

  function updateNewItem(index: number, patch: Partial<ItemRequest>) {
    setNewItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startTime || !endTime || startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }
    // Update requires a pickup location too, so auctions created before it existed must add one here.
    const pickupLocation = pickupDraftToLocation(pickup);
    if (typeof pickupLocation === "string") {
      setError(pickupLocation);
      return;
    }
    setSubmitting(true);
    try {
      const existingItems: ItemRequest[] = (auction?.items ?? []).map((it) => ({
        id: it.id,
        title: it.title,
        description: it.description,
        minimumPrice: it.minimumPrice,
      }));
      await auctionApi.update(auctionId, {
        title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        categories,
        biddingItems: [...existingItems, ...newItems.filter((it) => it.title.trim())],
        pickupLocation,
      });
      router.push(`/auctions/${auctionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        back={{ href: `/auctions/${auctionId}`, label: auction.title }}
        title="Edit auction"
        description="Update the schedule, categories, and pickup details, or add more items."
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-5 p-5">
          <CardHeader title="Details" description="The title and bidding window for this auction." />
          <Input id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateTimeField
              id="startTime"
              label="Start time"
              value={startTime}
              onChange={(d) => setStartTime(snapToQuarterHour(d))}
            />
            <DateTimeField
              id="endTime"
              label="End time"
              value={endTime}
              onChange={(d) => setEndTime(snapToQuarterHour(d))}
            />
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <CardHeader title="Categories" description="Help bidders find your auction." />
          <CategoryPicker selected={categories} onChange={setCategories} />
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <CardHeader title="Pickup information" description="Where the winning bidder collects the items." />
          <PickupLocationFields value={pickup} onChange={setPickup} />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <CardHeader title="Existing items" description="Existing items can't be edited or removed here." />
          </div>
          {auction.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 text-sm last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
                <Lock className="h-3.5 w-3.5 shrink-0 text-faint" />
                <span className="truncate">{it.title}</span>
              </span>
              {it.minimumPrice !== null && (
                <span className="tabular-ticker whitespace-nowrap text-muted">Reserve {formatMoney(it.minimumPrice)}</span>
              )}
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <CardHeader title="Add new items" description="New items are appended to this auction." />
          {newItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-fg">
                  New item {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setNewItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <Input
                id={`new-item-title-${i}`}
                label="Title"
                value={item.title}
                onChange={(e) => updateNewItem(i, { title: e.target.value })}
              />
              <Textarea
                id={`new-item-description-${i}`}
                label="Description"
                value={item.description}
                onChange={(e) => updateNewItem(i, { description: e.target.value })}
              />
              <Input
                id={`new-item-min-${i}`}
                label="Minimum price (optional)"
                type="number"
                min={0}
                value={item.minimumPrice ?? ""}
                onChange={(e) =>
                  updateNewItem(i, {
                    minimumPrice: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => setNewItems((prev) => [...prev, emptyItem()])}
            className="self-start"
          >
            Add item
          </Button>
        </Card>

        {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" icon={Save} disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

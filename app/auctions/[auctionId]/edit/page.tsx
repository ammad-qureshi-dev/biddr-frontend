"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Plus, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auctionApi, ApiError } from "@/lib/api";
import type { AuctionCategory, AuctionResponse, ItemRequest } from "@/lib/types";
import { toLocalDateTimeInputValue, snapToQuarterHour } from "@/lib/format";
import { formatMoney } from "@/lib/format";
import { Input, Textarea } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { DateTimeField } from "../../../components/ui/DateTimeField";
import { CategoryPicker } from "../../../components/domain/CategoryPicker";

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
  const [newItems, setNewItems] = useState<ItemRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    auctionApi
      .getById(auctionId)
      .then((a) => {
        setAuction(a);
        setTitle(a.title);
        setStartTime(new Date(a.startTime));
        setEndTime(new Date(a.endTime));
        setCategories(a.categories);
      })
      .catch(() => router.push(`/auctions/${auctionId}`));
  }, [auctionId]);

  useEffect(() => {
    if (auction && user && auction.ownerId !== user.id) router.push(`/auctions/${auctionId}`);
  }, [auction, user, auctionId, router]);

  if (!auction || !startTime || !endTime) {
    return <div className="mx-auto max-w-2xl px-6 py-16 font-sans text-sm text-slate-500">Loading…</div>;
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
      });
      router.push(`/auctions/${auctionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink-950">Edit auction</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
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

        <CategoryPicker selected={categories} onChange={setCategories} />

        <div className="flex flex-col gap-3">
          <span className="font-sans text-[13px] text-slate-500">Existing items</span>
          {auction.items.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-slate-200 bg-paper-100 p-3 font-sans text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-950">{it.title}</span>
                {it.minimumPrice !== null && (
                  <span className="text-slate-500">Reserve {formatMoney(it.minimumPrice)}</span>
                )}
              </div>
              <span className="text-xs text-slate-500">
                Existing items can&apos;t be edited or removed here.
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-sans text-[13px] text-slate-500">Add new items</span>
          {newItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-paper-100 p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold uppercase text-slate-500">
                  New item {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setNewItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="flex items-center gap-1 font-sans text-xs text-ledger-red hover:underline"
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
          >
            Add item
          </Button>
        </div>

        {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
        <Button type="submit" icon={Save} disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

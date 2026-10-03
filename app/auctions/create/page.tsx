"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Gavel } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auctionApi, ApiError } from "@/lib/api";
import type { AuctionCategory, ItemRequest } from "@/lib/types";
import { snapToQuarterHour } from "@/lib/format";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { DateTimeField } from "../../components/ui/DateTimeField";
import { CategoryPicker } from "../../components/domain/CategoryPicker";

function nextQuarterHour(offsetMinutes = 0) {
  return snapToQuarterHour(new Date(Date.now() + offsetMinutes * 60 * 1000));
}

const emptyItem = (): ItemRequest => ({ title: "", description: "", minimumPrice: null });

export default function CreateAuctionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState<Date>(() => nextQuarterHour(15));
  const [endTime, setEndTime] = useState<Date>(() => nextQuarterHour(24 * 60));
  const [categories, setCategories] = useState<AuctionCategory[]>([]);
  const [items, setItems] = useState<ItemRequest[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  function updateItem(index: number, patch: Partial<ItemRequest>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }
    if (items.length === 0 || items.some((it) => !it.title.trim())) {
      setError("Add at least one item, each with a title.");
      return;
    }

    setSubmitting(true);
    try {
      const id = await auctionApi.create({
        title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        categories,
        biddingItems: items,
      });
      router.push(`/auctions/${id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink-950">Create an auction</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Input id="title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateTimeField id="startTime" label="Start time" value={startTime} onChange={setStartTime} />
          <DateTimeField id="endTime" label="End time" value={endTime} onChange={setEndTime} />
        </div>

        <CategoryPicker selected={categories} onChange={setCategories} />

        <div className="flex flex-col gap-4">
          <span className="font-sans text-[13px] text-slate-500">Items</span>
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-paper-100 p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-semibold uppercase text-slate-500">
                  Item {i + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 font-sans text-xs text-ledger-red hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <Input
                id={`item-title-${i}`}
                label="Title"
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                required
              />
              <Textarea
                id={`item-description-${i}`}
                label="Description"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
              />
              <Input
                id={`item-min-${i}`}
                label="Minimum price (optional)"
                type="number"
                min={0}
                value={item.minimumPrice ?? ""}
                onChange={(e) =>
                  updateItem(i, {
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
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
          >
            Add another item
          </Button>
        </div>

        {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
        <Button type="submit" icon={Gavel} disabled={submitting}>
          {submitting ? "Creating…" : "Create auction"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, AuctionCategory } from "../../../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { AppShell } from "@/app/components/AppShell";
import { CategoryPicker } from "@/app/components/ui/CategoryPicker";

type EditItem = {
  id?: string;
  title: string;
  description: string;
  minimumPrice: string;
};

export default function EditAuctionPage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [categories, setCategories] = useState<AuctionCategory[]>([]);
  const [items, setItems] = useState<EditItem[]>([]);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAuction(auctionId),
      api.getAuctionItems(auctionId),
    ])
      .then(([auction, auctionItems]) => {
        setTitle(auction.title ?? "");
        setStartTime(toDatetimeLocal(auction.startTime));
        setEndTime(toDatetimeLocal(auction.endTime));
        setCategories(auction.categories ?? []);
        setItems(
          auctionItems.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description ?? "",
            minimumPrice:
              item.minimumPrice != null ? String(item.minimumPrice) : "",
          }))
        );
      })
      .catch(() => setLoadError("Could not load auction."))
      .finally(() => setInitializing(false));
  }, [auctionId]);

  function toDatetimeLocal(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function updateItem(index: number, field: keyof EditItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { title: "", description: "", minimumPrice: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.updateAuction(auctionId, {
        title,
        startTime: new Date(startTime).toISOString().replace("Z", ""),
        endTime: new Date(endTime).toISOString().replace("Z", ""),
        categories: categories.length > 0 ? categories : undefined,
        biddingItems: items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          minimumPrice: item.minimumPrice
            ? parseFloat(item.minimumPrice)
            : undefined,
        })),
      });
      router.push(`/auctions/${auctionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update auction.");
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{loadError}</p>
            <Link href="/auctions/my-auctions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              My Auctions
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-10 px-8">
        <div className="mb-8">
          <Link
            href="/auctions/my-auctions"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← My Auctions
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-3">
            Edit Auction
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card className="p-7 flex flex-col gap-5">
            <Input
              label="Title"
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-4">
              <Input
                className="flex-1"
                label="Start time"
                id="startTime"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                className="flex-1"
                label="End time"
                id="endTime"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <CategoryPicker selected={categories} onChange={setCategories} />
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300"
              >
                + Add item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <Card key={item.id ?? i} className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      {item.id ? `Item ${i + 1}` : `New item ${i + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <Input
                    type="text"
                    required
                    placeholder="Item title"
                    value={item.title}
                    onChange={(e) => updateItem(i, "title", e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Minimum price (optional)"
                    value={item.minimumPrice}
                    onChange={(e) =>
                      updateItem(i, "minimumPrice", e.target.value)
                    }
                  />
                </Card>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link href={`/auctions/${auctionId}`} className="flex-1">
              <Button variant="outline" className="w-full">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, AuctionCategory } from "../../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { AppShell } from "@/app/components/AppShell";
import { CategoryPicker } from "@/app/components/ui/CategoryPicker";

type Item = { title: string; description: string; minimumPrice: string };

export default function CreateAuctionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [categories, setCategories] = useState<AuctionCategory[]>([]);
  const [items, setItems] = useState<Item[]>([
    { title: "", description: "", minimumPrice: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, field: keyof Item, value: string) {
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
      const auctionId = await api.createAuction({
        title,
        startTime: new Date(startTime).toISOString().replace("Z", ""),
        endTime: new Date(endTime).toISOString().replace("Z", ""),
        categories: categories.length > 0 ? categories : undefined,
        biddingItems: items.map((item) => ({
          title: item.title,
          description: item.description || undefined,
          minimumPrice: item.minimumPrice
            ? parseFloat(item.minimumPrice)
            : undefined,
        })),
      });

      const stored = localStorage.getItem("auction_ids");
      const ids: string[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem("auction_ids", JSON.stringify([auctionId, ...ids]));

      router.push(`/auctions/${auctionId}`);
    } catch (e) {
      console.log(e);
      setError("Failed to create auction. Make sure you are signed in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-10 px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-3">
            Create Auction
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
              placeholder="e.g. Vintage Watch Collection"
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
                <Card key={i} className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Item {i + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create Auction"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

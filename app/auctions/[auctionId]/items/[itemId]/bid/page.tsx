"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../lib/api";

export default function PlaceBidPage() {
  const { auctionId, itemId } = useParams<{ auctionId: string; itemId: string }>();

  const [itemTitle, setItemTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getItem(itemId)
      .then((item) => setItemTitle(item.title))
      .catch(() => {});
  }, [itemId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.createBid({
        auctionId,
        itemId,
        amount: parseFloat(amount),
        placedAt: new Date().toISOString().replace("Z", ""),
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString().replace("Z", "")
          : undefined,
      });
      setPlaced(true);
    } catch {
      setError("Failed to place bid. Make sure you are signed in.");
    } finally {
      setLoading(false);
    }
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-sm w-full text-center">
          <h2 className="text-lg font-semibold text-gray-100 mb-1">Bid placed!</h2>
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => { setPlaced(false); setAmount(""); setExpiresAt(""); }}
              className="w-full border border-gray-600 text-gray-300 py-2 rounded text-sm hover:bg-gray-800"
            >
              Place another bid
            </button>
            <Link
              href={`/auctions/${auctionId}`}
              className="block w-full bg-gray-100 text-gray-900 py-2 rounded text-sm font-medium hover:bg-white text-center"
            >
              View auction
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-sm mx-auto py-12 px-4">
        <div className="mb-8">
          <Link href={`/auctions/${auctionId}`} className="text-sm text-gray-500 hover:text-gray-200">
            ← Auction
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-gray-100 mb-1">Place Bid</h1>
          {itemTitle && <p className="text-sm text-gray-400 mb-5">{itemTitle}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bid amount ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expires at (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-100 text-gray-900 py-2 rounded text-sm font-medium hover:bg-white disabled:opacity-50"
            >
              {loading ? "Placing bid..." : "Place bid"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

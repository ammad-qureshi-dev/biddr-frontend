"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Badge, auctionStatusVariant } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { AppShell } from "@/app/components/AppShell";

type AuctionResult = {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
};

const STATUS_OPTIONS = ["", "OPEN", "PAUSED", "CLOSED"] as const;

export default function DashboardPage() {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"" | "OPEN" | "PAUSED" | "CLOSED">("");
  const [startAfter, setStartAfter] = useState("");
  const [endBefore, setEndBefore] = useState("");
  const [results, setResults] = useState<AuctionResult[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.searchAuctions({
        title: title || undefined,
        status: status || undefined,
        startAfter: startAfter
          ? new Date(startAfter).toISOString().replace("Z", "")
          : undefined,
        endBefore: endBefore
          ? new Date(endBefore).toISOString().replace("Z", "")
          : undefined,
      });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-10 px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Auctions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search and browse live auctions
            </p>
          </div>
          <Link href="/auctions/create">
            <Button>+ New Auction</Button>
          </Link>
        </div>

        <Card className="p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <Input
                className="flex-1"
                placeholder="Search by title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Select
                className="w-44"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "" | "OPEN" | "PAUSED" | "CLOSED")
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s || "Any status"}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-3">
              <Input
                className="flex-1"
                label="Start after"
                type="datetime-local"
                value={startAfter}
                onChange={(e) => setStartAfter(e.target.value)}
              />
              <Input
                className="flex-1"
                label="End before"
                type="datetime-local"
                value={endBefore}
                onChange={(e) => setEndBefore(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Searching…" : "Search"}
            </Button>
          </form>
        </Card>

        {results !== null && (
          <Card className="overflow-hidden">
            {results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No auctions found.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((auction) => (
                  <li key={auction.id}>
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                          {auction.title}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(auction.startTime).toLocaleDateString()} →{" "}
                          {new Date(auction.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={auctionStatusVariant(auction.status)}
                        className="ml-6 shrink-0"
                      >
                        {auction.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

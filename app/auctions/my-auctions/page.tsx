"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Badge, auctionStatusVariant } from "@/app/components/ui/Badge";
import { Card } from "@/app/components/ui/Card";
import { AppShell } from "@/app/components/AppShell";

type Auction = {
  id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
};

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMyAuctions()
      .then(setAuctions)
      .catch(() =>
        setError("Could not load your auctions. Make sure you are signed in.")
      );
  }, []);

  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full py-24">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
            <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!auctions) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full py-24">
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto py-10 px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              My Auctions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Auctions you have created
            </p>
          </div>
          <Link href="/auctions/create">
            <Button>+ New Auction</Button>
          </Link>
        </div>

        {auctions.length === 0 ? (
          <Card className="py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven&apos;t created any auctions yet.
            </p>
            <Link href="/auctions/create">
              <Button variant="outline">Create your first auction</Button>
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {auctions.map((auction) => (
                <li
                  key={auction.id}
                  className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                        {auction.title}
                      </p>
                      <Badge
                        variant={auctionStatusVariant(auction.status)}
                        className="shrink-0"
                      >
                        {auction.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {new Date(auction.startTime).toLocaleDateString()} →{" "}
                      {new Date(auction.endTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-6 shrink-0">
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      View
                    </Link>
                    <Link href={`/auctions/${auction.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

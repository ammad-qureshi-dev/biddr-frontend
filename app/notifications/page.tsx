"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { notificationApi } from "@/lib/api";
import type { ContactType, NotificationResponse, NotificationType } from "@/lib/types";
import { StatusPill } from "../components/ui/StatusPill";
import { NotificationStatusPill } from "../components/domain/StatusPills";
import { EmptyState } from "../components/ui/EmptyState";

const PAGE_SIZE = 10;

const TYPE_TONE: Record<NotificationType, "green" | "red" | "slate" | "ink" | "red-outline"> = {
  SUCCESS: "green",
  ERROR: "red",
  WARNING: "red-outline",
  ACTION_REQUIRED: "ink",
  INFO: "slate",
};

const TYPE_LABEL: Record<NotificationType, string> = {
  SUCCESS: "Success",
  ERROR: "Error",
  WARNING: "Warning",
  ACTION_REQUIRED: "Action Required",
  INFO: "Info",
};

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationResponse[] | null>(null);
  const [channel, setChannel] = useState<ContactType | "">("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    setNotifications(null);
    notificationApi
      .getHistory({ contactType: channel || undefined, page: 0, size: PAGE_SIZE })
      .then((res) => {
        setNotifications(res.content);
        setPage(0);
        setHasNext(res.hasNext);
      })
      .catch(() => {
        setNotifications([]);
        setHasNext(false);
      });
  }, [user, channel]);

  const loadMore = useCallback(() => {
    if (!user || loadingMore || !hasNext) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    notificationApi
      .getHistory({ contactType: channel || undefined, page: nextPage, size: PAGE_SIZE })
      .then((res) => {
        setNotifications((prev) => [...(prev ?? []), ...res.content]);
        setPage(nextPage);
        setHasNext(res.hasNext);
      })
      .finally(() => setLoadingMore(false));
  }, [user, loadingMore, hasNext, page, channel]);

  // Fires once the row halfway through the currently loaded list scrolls into
  // view inside the scrollable list container, so the next page arrives
  // before the user reaches the bottom.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [midpointEl, setMidpointEl] = useState<HTMLDivElement | null>(null);
  const midpointIndex = notifications ? Math.floor(notifications.length / 2) : -1;

  useEffect(() => {
    if (!scrollEl || !midpointEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: scrollEl },
    );
    observer.observe(midpointEl);
    return () => observer.disconnect();
  }, [scrollEl, midpointEl, loadMore]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Notifications</h1>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ContactType | "")}
          className="min-h-9 rounded-xl border border-slate-200 bg-paper-100 px-3 font-sans text-sm text-ink-950 outline-none"
        >
          <option value="">All channels</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="APP">App</option>
        </select>
      </div>

      <div
        ref={setScrollEl}
        className="mt-6 flex h-80 flex-col gap-2 overflow-y-auto"
      >
        {notifications === null ? (
          <p className="font-sans text-sm text-slate-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" body="You're all caught up." />
        ) : (
          notifications.map((n, i) => (
            <div
              key={i}
              ref={i === midpointIndex ? setMidpointEl : undefined}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-paper-100 p-4"
            >
              <span className="font-sans text-sm text-ink-950">{n.subject}</span>
              <div className="flex items-center gap-2">
                <StatusPill label={TYPE_LABEL[n.type]} tone={TYPE_TONE[n.type]} />
                <NotificationStatusPill status={n.status} />
              </div>
            </div>
          ))
        )}
        {loadingMore && <p className="py-2 text-center font-sans text-sm text-slate-500">Loading more…</p>}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { notificationApi } from "@/lib/api";
import type { ContactType, NotificationResponse, NotificationType } from "@/lib/types";
import { StatusPill, type PillTone } from "../components/ui/StatusPill";
import { NotificationStatusPill } from "../components/domain/StatusPills";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Segmented } from "../components/ui/Segmented";

const PAGE_SIZE = 10;

const TYPE_TONE: Record<NotificationType, PillTone> = {
  SUCCESS: "success",
  ERROR: "danger",
  WARNING: "warning",
  ACTION_REQUIRED: "info",
  INFO: "neutral",
};

const CHANNEL_OPTIONS: { value: ContactType | ""; label: string }[] = [
  { value: "", label: "All channels" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "APP", label: "App" },
];

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
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="Notifications" description="Everything Bidder has sent you, newest first." />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-semibold text-fg">Inbox</h2>
          <Segmented label="Filter by channel" options={CHANNEL_OPTIONS} value={channel} onChange={setChannel} />
        </div>

        <div ref={setScrollEl} className="flex h-[32rem] flex-col overflow-y-auto">
          {notifications === null ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No notifications" body="You're all caught up." />
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={i}
                ref={i === midpointIndex ? setMidpointEl : undefined}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-5 py-3.5 last:border-b-0 sm:flex-nowrap"
              >
                <span className="min-w-0 flex-1 text-sm text-fg">{n.subject}</span>
                <div className="flex items-center gap-5">
                  <StatusPill label={TYPE_LABEL[n.type]} tone={TYPE_TONE[n.type]} />
                  <NotificationStatusPill status={n.status} />
                </div>
              </div>
            ))
          )}
          {loadingMore && <p className="py-3 text-center text-sm text-muted">Loading more…</p>}
        </div>
      </Card>
    </div>
  );
}

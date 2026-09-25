"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { notificationApi } from "@/lib/api";
import type { ContactType, NotificationResponse, NotificationType } from "@/lib/types";
import { StatusPill } from "../components/ui/StatusPill";
import { EmptyState } from "../components/ui/EmptyState";

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

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user)
      notificationApi
        .getHistory(user.id, channel || undefined)
        .then(setNotifications)
        .catch(() => setNotifications([]));
  }, [user, channel]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <h1 className="font-display text-3xl font-semibold text-ink-950">Notifications</h1>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ContactType | "")}
          className="min-h-9 rounded-lg border border-slate-200 bg-paper-100 px-3 font-sans text-sm text-ink-950 outline-none"
        >
          <option value="">All channels</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="APP">App</option>
        </select>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {notifications === null ? (
          <p className="font-sans text-sm text-slate-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" body="You're all caught up." />
        ) : (
          notifications.map((n, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-paper-100 p-4"
            >
              <span className="font-sans text-sm text-ink-950">{n.subject}</span>
              <div className="flex items-center gap-2">
                <StatusPill label={TYPE_LABEL[n.type]} tone={TYPE_TONE[n.type]} />
                <span className="font-sans text-xs text-slate-500">
                  {n.status === "OPENED" ? "Opened" : "Sent"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

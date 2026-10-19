import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NOTIFICATIONS_ENABLED } from "@/lib/features";

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  if (!NOTIFICATIONS_ENABLED) redirect("/");
  return children;
}

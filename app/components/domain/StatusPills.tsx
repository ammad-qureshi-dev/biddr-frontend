import { StatusPill } from "../ui/StatusPill";
import type { AuctionStatus, BidStatus, NotificationStatus } from "@/lib/types";

export function AuctionStatusPill({
  status,
  endingSoon,
}: {
  status: AuctionStatus;
  endingSoon?: boolean;
}) {
  if (status === "LIVE" && endingSoon) {
    return <StatusPill label="Ending Soon" tone="red" />;
  }
  switch (status) {
    case "LIVE":
      return <StatusPill label="Live" tone="green" />;
    case "UPCOMING":
      return <StatusPill label="Upcoming" tone="slate" />;
    case "PAUSED":
      return <StatusPill label="Paused" tone="slate" />;
    case "CLOSED":
      return <StatusPill label="Closed" tone="ink" />;
  }
}

const BID_STATUS_LABEL: Record<BidStatus, string> = {
  ACTIVE: "Active",
  OUTBID: "Outbid",
  WINNER: "Winner",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  PENDING_VALIDATION: "Pending",
};

export function BidStatusPill({ status }: { status: BidStatus }) {
  const label = BID_STATUS_LABEL[status];
  switch (status) {
    case "ACTIVE":
      return <StatusPill label={label} tone="green" />;
    case "WINNER":
      return <StatusPill label={label} tone="green" />;
    case "OUTBID":
      return <StatusPill label={label} tone="red" />;
    case "REJECTED":
      return <StatusPill label={label} tone="red-outline" />;
    default:
      return <StatusPill label={label} tone="slate" />;
  }
}

export function NotificationStatusPill({ status }: { status: NotificationStatus }) {
  switch (status) {
    case "SENT":
      return <StatusPill label="Sent" tone="slate" />;
    case "OPENED":
      return <StatusPill label="Opened" tone="ink" />;
    case "FAILED_TO_SEND":
      return <StatusPill label="Failed to Send" tone="red" />;
  }
}

export function ItemSoldBadge() {
  return <StatusPill label="Sold" tone="ink" />;
}

export function ReserveNotMetBadge() {
  return <StatusPill label="Reserve Not Met" tone="red-outline" />;
}

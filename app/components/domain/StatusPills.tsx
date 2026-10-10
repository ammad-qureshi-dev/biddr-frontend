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
    return <StatusPill label="Ending soon" tone="danger" />;
  }
  switch (status) {
    case "LIVE":
      return <StatusPill label="Live" tone="success" />;
    case "UPCOMING":
      return <StatusPill label="Upcoming" tone="info" />;
    case "PAUSED":
      return <StatusPill label="Paused" tone="warning" />;
    case "CLOSED":
      return <StatusPill label="Closed" tone="neutral" />;
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
      return <StatusPill label={label} tone="success" />;
    case "WINNER":
      return <StatusPill label={label} tone="info" />;
    case "OUTBID":
      return <StatusPill label={label} tone="danger" />;
    case "REJECTED":
      return <StatusPill label={label} tone="danger" />;
    default:
      return <StatusPill label={label} tone="neutral" />;
  }
}

export function NotificationStatusPill({ status }: { status: NotificationStatus }) {
  switch (status) {
    case "SENT":
      return <StatusPill label="Sent" tone="info" />;
    case "OPENED":
      return <StatusPill label="Opened" tone="neutral" />;
    case "FAILED_TO_SEND":
      return <StatusPill label="Failed to send" tone="danger" />;
  }
}

export function ItemSoldBadge() {
  return <StatusPill label="Sold" tone="neutral" />;
}

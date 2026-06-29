interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "open"
    | "paused"
    | "closed"
    | "accepted"
    | "rejected"
    | "pending"
    | "default";
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  open: "bg-emerald-950/60 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  paused: "bg-amber-950/60 text-amber-400 ring-1 ring-inset ring-amber-500/30",
  closed: "bg-gray-800 text-gray-400 ring-1 ring-inset ring-gray-600/30",
  accepted: "bg-emerald-950/60 text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  rejected: "bg-red-950/60 text-red-400 ring-1 ring-inset ring-red-500/30",
  pending: "bg-gray-800 text-gray-400 ring-1 ring-inset ring-gray-600/30",
  default: "bg-gray-800 text-gray-400 ring-1 ring-inset ring-gray-600/30",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function auctionStatusVariant(
  status: string
): NonNullable<BadgeProps["variant"]> {
  const map: Record<string, NonNullable<BadgeProps["variant"]>> = {
    OPEN: "open",
    PAUSED: "paused",
    CLOSED: "closed",
  };
  return map[status] ?? "default";
}

export function bidStatusVariant(
  status: string | null
): NonNullable<BadgeProps["variant"]> {
  if (status === "WINNER") return "accepted";
  if (status === "REJECTED") return "rejected";
  if (status === "ACTIVE") return "open";
  if (status === "OUTBID") return "paused";
  return "default";
}

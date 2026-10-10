import { ArrowRight, type LucideIcon } from "lucide-react";
import { LinkButton } from "./Button";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
  actionIcon = ArrowRight,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-line px-8 py-16 text-center">
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {actionLabel && actionHref && (
        <LinkButton href={actionHref} icon={actionIcon} variant="secondary" className="mt-4">
          {actionLabel}
        </LinkButton>
      )}
    </div>
  );
}

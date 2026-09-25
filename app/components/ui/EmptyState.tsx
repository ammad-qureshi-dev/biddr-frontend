import Link from "next/link";

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-paper-100 px-8 py-16 text-center">
      <h3 className="font-display text-2xl font-semibold text-ink-950">{title}</h3>
      <p className="max-w-sm font-sans text-sm text-slate-500">{body}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-2">
          <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brass-500 px-5 font-sans text-sm font-semibold text-ink-950 hover:bg-brass-600">
            {actionLabel}
          </span>
        </Link>
      )}
    </div>
  );
}

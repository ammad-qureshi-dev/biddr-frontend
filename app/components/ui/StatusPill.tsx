export type PillTone = "success" | "danger" | "warning" | "info" | "neutral";

const dotClass: Record<PillTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-accent",
  neutral: "bg-faint",
};

/** Status as a small colored dot plus a text label — color is never the only signal. */
export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-fg">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[tone]}`} />
      {label}
    </span>
  );
}

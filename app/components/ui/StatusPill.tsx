type PillTone = "green" | "red" | "slate" | "ink" | "red-outline";

const toneClass: Record<PillTone, string> = {
  green: "bg-ledger-green text-neutral-900",
  red: "bg-ledger-red text-neutral-900",
  slate: "bg-slate-500 text-neutral-900",
  ink: "bg-ink-950 text-neutral-900",
  "red-outline": "bg-transparent border border-ledger-red text-ledger-red",
};

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-sans text-xs font-semibold uppercase tracking-wide ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}

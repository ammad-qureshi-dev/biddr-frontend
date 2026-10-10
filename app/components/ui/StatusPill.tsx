type PillTone = "green" | "red" | "slate" | "ink" | "red-outline";

const toneClass: Record<PillTone, string> = {
  green: "bg-ledger-green text-white",
  red: "bg-ledger-red text-white",
  slate: "bg-slate-500 text-white",
  ink: "bg-ink-950 text-white",
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

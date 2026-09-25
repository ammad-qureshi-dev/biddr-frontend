import { snapToQuarterHour, toLocalDateTimeInputValue } from "@/lib/format";

export function DateTimeField({
  label,
  value,
  onChange,
  error,
  id,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-[13px] text-slate-500">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        step={900}
        value={toLocalDateTimeInputValue(value?.toISOString())}
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(new Date(e.target.value));
        }}
        onBlur={(e) => {
          if (!e.target.value) return;
          onChange(snapToQuarterHour(new Date(e.target.value)));
        }}
        className="tabular-ticker min-h-11 rounded-lg border border-slate-200 bg-paper-100 px-3.5 text-sm text-ink-950 outline-none focus:border-2 focus:border-brass-500"
      />
      <span className="font-sans text-xs text-slate-500">15-minute increments only.</span>
      {error && <span className="font-sans text-xs text-ledger-red">{error}</span>}
    </div>
  );
}

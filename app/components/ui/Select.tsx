import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, className = "", children, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-sans text-[13px] text-slate-500">
        {label}
      </label>
      <select
        id={id}
        className={`bg-paper-50 border border-slate-200 rounded-xl px-3.5 min-h-12 font-sans text-sm text-ink-950 outline-none focus:border-2 focus:border-ink-950 focus:px-[13px] ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="font-sans text-xs text-ledger-red">{error}</span>}
    </div>
  );
}

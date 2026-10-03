import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldWrapperProps = {
  label: string;
  error?: string;
  hint?: string;
};

function FieldChrome({
  label,
  error,
  hint,
  htmlFor,
  children,
}: FieldWrapperProps & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-sans text-[13px] text-slate-500">
        {label}
      </label>
      {children}
      {hint && !error && (
        <span className="font-sans text-xs text-slate-500">{hint}</span>
      )}
      {error && (
        <span className="font-sans text-xs text-ledger-red">{error}</span>
      )}
    </div>
  );
}

const fieldClass =
  "bg-paper-50 border border-slate-200 rounded-xl px-3.5 min-h-12 font-sans text-sm text-ink-950 outline-none focus:border-2 focus:border-ink-950 focus:px-[13px]";

type InputProps = InputHTMLAttributes<HTMLInputElement> &
  FieldWrapperProps;

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  return (
    <FieldChrome label={label} error={error} hint={hint} htmlFor={id!}>
      <input id={id} className={`${fieldClass} ${className}`} {...props} />
    </FieldChrome>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldWrapperProps;

export function Textarea({ label, error, hint, id, className = "", ...props }: TextareaProps) {
  return (
    <FieldChrome label={label} error={error} hint={hint} htmlFor={id!}>
      <textarea
        id={id}
        className={`${fieldClass} min-h-24 py-2.5 resize-y ${className}`}
        {...props}
      />
    </FieldChrome>
  );
}

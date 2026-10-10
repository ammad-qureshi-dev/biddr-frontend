import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldWrapperProps = {
  label: string;
  error?: string;
  hint?: string;
};

export function FieldChrome({
  label,
  error,
  hint,
  htmlFor,
  children,
}: FieldWrapperProps & { htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] text-muted">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export const fieldClass =
  "min-h-11 rounded-[10px] border border-line bg-surface px-3.5 font-sans text-sm text-fg outline-none transition-colors placeholder:text-faint hover:border-line-strong focus:border-fg";

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps;

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  return (
    <FieldChrome label={label} error={error} hint={hint} htmlFor={id!}>
      <input id={id} className={`${fieldClass} ${className}`} {...props} />
    </FieldChrome>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps;

export function Textarea({ label, error, hint, id, className = "", ...props }: TextareaProps) {
  return (
    <FieldChrome label={label} error={error} hint={hint} htmlFor={id!}>
      <textarea id={id} className={`${fieldClass} min-h-24 resize-y py-2.5 ${className}`} {...props} />
    </FieldChrome>
  );
}

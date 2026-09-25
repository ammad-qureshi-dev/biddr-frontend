import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const base =
  "inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-lg font-sans text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-brass-500 text-ink-950 hover:bg-brass-600 active:scale-[0.98] shadow-none",
  secondary:
    "bg-transparent border-[1.5px] border-ink-950 text-ink-950 hover:bg-ink-950/5 dark:border-paper-50",
  tertiary:
    "bg-transparent text-slate-500 hover:underline px-2 min-h-0 font-medium",
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "tertiary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: LucideIcon;
};

const base =
  "inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-full font-sans text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-brass-500 text-neutral-900 hover:bg-brass-600 active:scale-[0.98] shadow-none",
  secondary:
    "bg-transparent border-[1.5px] border-ink-950 text-ink-950 hover:bg-ink-950/5",
  tertiary:
    "bg-transparent text-slate-500 hover:underline px-2 min-h-0 rounded-md font-medium",
};

export function Button({ variant = "primary", icon: Icon, className = "", children, ...props }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

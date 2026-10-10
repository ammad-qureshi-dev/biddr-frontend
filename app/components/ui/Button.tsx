import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-sans text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4",
  sm: "min-h-9 px-3 text-[13px]",
};

const variants: Record<Variant, string> = {
  primary: "bg-fg text-surface hover:opacity-90 active:scale-[0.98]",
  secondary: "border border-line bg-surface text-fg hover:bg-subtle",
  tertiary: "bg-transparent text-muted hover:text-fg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/** A navigation link styled as a button — use instead of nesting a <Button> inside a <Link>. */
export function LinkButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: LucideIcon }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

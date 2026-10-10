export function Avatar({ name, size = "md" }: { name: string | undefined; size?: "sm" | "md" }) {
  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  const sizeClass = size === "sm" ? "h-8 w-8 text-[13px]" : "h-10 w-10 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border border-line bg-subtle font-medium text-fg ${sizeClass}`}
    >
      {initial}
    </span>
  );
}

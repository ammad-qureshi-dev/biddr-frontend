import { Check } from "lucide-react";
import { AUCTION_CATEGORIES, CATEGORY_LABELS, type AuctionCategory } from "@/lib/types";

export function CategoryPicker({
  selected,
  onChange,
}: {
  selected: AuctionCategory[];
  onChange: (categories: AuctionCategory[]) => void;
}) {
  function toggle(category: AuctionCategory) {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AUCTION_CATEGORIES.map((category) => {
        const active = selected.includes(category);
        return (
          <button
            key={category}
            type="button"
            onClick={() => toggle(category)}
            aria-pressed={active}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors ${
              active ? "border-fg bg-fg text-surface" : "border-line text-fg hover:bg-subtle"
            }`}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}

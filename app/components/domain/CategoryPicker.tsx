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
    <div className="flex flex-col gap-1.5">
      <span className="font-sans text-[13px] text-slate-500">Categories</span>
      <div className="flex flex-wrap gap-2">
        {AUCTION_CATEGORIES.map((category) => {
          const active = selected.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggle(category)}
              aria-pressed={active}
              className={`min-h-9 rounded-full border px-3 font-sans text-xs font-medium transition-colors ${
                active
                  ? "border-brass-500 bg-brass-500 text-ink-950"
                  : "border-slate-200 bg-paper-100 text-ink-950 hover:border-brass-500"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

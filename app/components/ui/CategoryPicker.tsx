import { AuctionCategory } from "@/app/lib/api";

const ALL_CATEGORIES: AuctionCategory[] = [
  "ELECTRONICS",
  "VEHICLES",
  "REAL_ESTATE",
  "ART_AND_COLLECTIBLES",
  "JEWELLERY_AND_WATCHES",
  "FASHION_AND_ACCESSORIES",
  "FURNITURE_AND_HOME",
  "SPORTS_AND_OUTDOORS",
  "BOOKS_AND_MEDIA",
  "TOYS_AND_GAMES",
  "INDUSTRIAL_AND_MACHINERY",
  "ANTIQUES",
  "OTHER",
];

function formatCategory(cat: AuctionCategory): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

interface CategoryPickerProps {
  selected: AuctionCategory[];
  onChange: (next: AuctionCategory[]) => void;
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  function toggle(cat: AuctionCategory) {
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat]
    );
  }

  return (
    <div>
      <p className="block text-sm font-medium text-gray-300 mb-2">
        Categories <span className="text-gray-500 font-normal">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const active = selected.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              className={[
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                active
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200",
              ].join(" ")}
            >
              {formatCategory(cat)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

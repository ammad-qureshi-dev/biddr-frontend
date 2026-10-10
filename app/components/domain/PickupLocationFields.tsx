import type { PickupLocation } from "@/lib/types";
import { Input, Textarea } from "../ui/Input";

const REQUIRED_KEYS = ["unit", "street", "city", "postalCode", "state", "country"] as const;

/** Form state for a pickup location — every value is a string while being edited. */
export type PickupDraft = Record<keyof PickupLocation, string>;

export const emptyPickupDraft = (): PickupDraft => ({
  unit: "",
  street: "",
  city: "",
  postalCode: "",
  state: "",
  country: "",
  instructions: "",
});

export function pickupDraftFrom(loc: PickupLocation | null): PickupDraft {
  if (!loc) return emptyPickupDraft();
  return { ...loc, unit: String(loc.unit), instructions: loc.instructions ?? "" };
}

/**
 * Validates the draft the same way catalog-service does (every field but `instructions` present
 * and non-blank, unit a whole number) so the user gets a specific message instead of the
 * backend's generic 500. Returns the location, or an error message string.
 */
export function pickupDraftToLocation(draft: PickupDraft): PickupLocation | string {
  const trimmed = Object.fromEntries(
    Object.entries(draft).map(([k, v]) => [k, v.trim()]),
  ) as PickupDraft;
  if (REQUIRED_KEYS.some((k) => trimmed[k] === "")) {
    return "Fill in every pickup location field.";
  }
  if (!/^\d+$/.test(trimmed.unit)) {
    return "Unit must be a whole number.";
  }
  if (trimmed.instructions.length > 512) {
    return "Pickup instructions must be 512 characters or fewer.";
  }
  return { ...trimmed, unit: Number(trimmed.unit), instructions: trimmed.instructions || null };
}

export function PickupLocationFields({
  value,
  onChange,
}: {
  value: PickupDraft;
  onChange: (value: PickupDraft) => void;
}) {
  const field = (key: keyof PickupDraft) => ({
    id: `pickup-${key}`,
    value: value[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value }),
    required: true,
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Input label="Unit" type="number" min={0} step={1} inputMode="numeric" {...field("unit")} />
      </div>
      <div className="sm:col-span-4">
        <Input label="Street" autoComplete="address-line1" {...field("street")} />
      </div>
      <div className="sm:col-span-3">
        <Input label="City" autoComplete="address-level2" {...field("city")} />
      </div>
      <div className="sm:col-span-3">
        <Input label="State / province" autoComplete="address-level1" {...field("state")} />
      </div>
      <div className="sm:col-span-3">
        <Input label="Postal code" autoComplete="postal-code" {...field("postalCode")} />
      </div>
      <div className="sm:col-span-3">
        <Input label="Country" autoComplete="country-name" {...field("country")} />
      </div>
      <div className="sm:col-span-6">
        <Textarea
          label="Pickup instructions (optional)"
          hint="e.g. buzz #4, use the loading dock, available after 5pm"
          maxLength={512}
          id="pickup-instructions"
          value={value.instructions}
          onChange={(e) => onChange({ ...value, instructions: e.target.value })}
        />
      </div>
    </div>
  );
}

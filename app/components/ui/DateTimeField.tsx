import { snapToQuarterHour, toLocalDateTimeInputValue } from "@/lib/format";
import { FieldChrome, fieldClass } from "./Input";

export function DateTimeField({
  label,
  value,
  onChange,
  error,
  id,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
  id: string;
}) {
  return (
    <FieldChrome label={label} error={error} hint="15-minute increments only." htmlFor={id}>
      <input
        id={id}
        type="datetime-local"
        step={900}
        value={toLocalDateTimeInputValue(value?.toISOString())}
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(new Date(e.target.value));
        }}
        onBlur={(e) => {
          if (!e.target.value) return;
          onChange(snapToQuarterHour(new Date(e.target.value)));
        }}
        className={`tabular-ticker ${fieldClass}`}
      />
    </FieldChrome>
  );
}

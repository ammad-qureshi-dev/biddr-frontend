"use client";

import { useState, type KeyboardEvent } from "react";
import { snapToQuarterHour, toLocalDateTimeInputValue } from "@/lib/format";
import { FieldChrome } from "./Input";

type Parts = { date: string; hour: number | null; minute: number; pm: boolean };

const MINUTES = [0, 15, 30, 45];
const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-10-17" → { monthDay: "Oct 17", year: 2026 }. Built by hand so server and client match.
function formatDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { monthDay: `${MONTHS[m - 1]} ${d}`, year: y };
}

function fromDate(value: Date): Parts {
  const snapped = snapToQuarterHour(value);
  const h = snapped.getHours();
  return {
    date: toLocalDateTimeInputValue(snapped.toISOString()).split("T")[0],
    hour: h % 12 || 12,
    minute: snapped.getMinutes(),
    pm: h >= 12,
  };
}

/**
 * Date plus a 12-hour time split into hour / minute / AM-PM. Native time inputs can't stop
 * other minutes being typed, so the minute here only ever takes a quarter-hour value.
 */
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
  // Holds a half-entered value (e.g. a date with no hour yet) until it's complete.
  const [draft, setDraft] = useState<Parts>({ date: "", hour: null, minute: 0, pm: false });
  // Raw hour text while typing, so "1" can become "12" without being reformatted mid-edit.
  const [hourText, setHourText] = useState<string | null>(null);
  const parts = value ? fromDate(value) : draft;

  const update = (patch: Partial<Parts>) => {
    const next = { ...parts, ...patch };
    setDraft(next);
    if (next.date && next.hour !== null) {
      const h24 = (next.hour % 12) + (next.pm ? 12 : 0);
      onChange(new Date(`${next.date}T${pad(h24)}:${pad(next.minute)}`));
    }
  };

  const stepMinute = (dir: 1 | -1) =>
    update({ minute: MINUTES[(MINUTES.indexOf(parts.minute) + dir + MINUTES.length) % MINUTES.length] });

  const onHourKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const dir = e.key === "ArrowUp" ? 1 : -1;
    setHourText(null);
    update({ hour: parts.hour === null ? 12 : ((parts.hour - 1 + dir + 12) % 12) + 1 });
  };

  const onMinuteKey = (e: KeyboardEvent) => {
    const typed: Record<string, number> = { "0": 0, "1": 15, "3": 30, "4": 45 };
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      stepMinute(e.key === "ArrowUp" ? 1 : -1);
    } else if (e.key in typed) {
      update({ minute: typed[e.key] });
    }
  };

  const onPeriodKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "a" || k === "p") update({ pm: k === "p" });
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      update({ pm: !parts.pm });
    }
  };

  // Segments sit borderless inside one shared field; the focus ring is drawn inset so it
  // doesn't collide with the outer border.
  const segment =
    "tabular-ticker h-11 shrink-0 bg-transparent text-center text-sm text-fg outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent rounded-md placeholder:text-faint";

  return (
    <FieldChrome label={label} error={error} htmlFor={id}>
      <div
        className={`@container flex min-h-11 items-center rounded-[10px] border bg-surface transition-colors focus-within:border-fg ${
          error ? "border-danger" : "border-line hover:border-line-strong"
        }`}
      >
        {/* The native date input sits invisibly on top of a compact label, so tapping still
            opens the platform's own date picker but the field shows "Oct 17, 2026". */}
        <div className="relative flex h-11 min-w-0 flex-1 items-center pl-3.5 pr-2">
          <span className={`tabular-ticker truncate text-sm ${parts.date ? "text-fg" : "text-faint"}`}>
            {parts.date ? (
              <>
                {formatDate(parts.date).monthDay}
                {/* Year drops when the field is too narrow to fit it beside the time. */}
                <span className="hidden @[14rem]:inline">, {formatDate(parts.date).year}</span>
              </>
            ) : (
              "Pick a date"
            )}
          </span>
          <input
            id={id}
            type="date"
            value={parts.date}
            onChange={(e) => e.target.value && update({ date: e.target.value })}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="absolute inset-0 h-full w-full cursor-pointer rounded-l-[10px] opacity-0 focus-visible:opacity-100 focus-visible:bg-transparent focus-visible:text-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </div>
        <span aria-hidden className="h-5 w-px shrink-0 bg-line" />
        <div className="flex shrink-0 items-center px-0.5">
          <input
            type="text"
            inputMode="numeric"
            aria-label={`${label}, hour`}
            placeholder="--"
            value={hourText ?? (parts.hour === null ? "" : pad(parts.hour))}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(-2);
              setHourText(digits);
              const n = Number(digits);
              if (n >= 1 && n <= 12) update({ hour: n });
            }}
            onKeyDown={onHourKey}
            onFocus={(e) => e.target.select()}
            onBlur={() => setHourText(null)}
            className={`${segment} w-8`}
          />
          <span aria-hidden className="text-muted">
            :
          </span>
          <button
            type="button"
            role="spinbutton"
            aria-label={`${label}, minutes`}
            aria-valuenow={parts.minute}
            aria-valuemin={0}
            aria-valuemax={45}
            onClick={() => stepMinute(1)}
            onKeyDown={onMinuteKey}
            className={`${segment} w-8`}
          >
            {pad(parts.minute)}
          </button>
          <button
            type="button"
            aria-label={`${label}, AM or PM`}
            onClick={() => update({ pm: !parts.pm })}
            onKeyDown={onPeriodKey}
            className={`${segment} w-10 text-muted hover:text-fg`}
          >
            {parts.pm ? "PM" : "AM"}
          </button>
        </div>
      </div>
    </FieldChrome>
  );
}

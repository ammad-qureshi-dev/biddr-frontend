"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { formatMoney } from "@/lib/format";

function suggestedStep(base: number) {
  if (base >= 10000) return 250;
  if (base >= 1000) return 50;
  if (base >= 100) return 10;
  return 1;
}

export function BidInput({
  currentHighest,
  minimumPrice,
  onSubmit,
  disabled,
  disabledReason,
}: {
  currentHighest: number | null;
  minimumPrice: number | null;
  onSubmit: (amount: number) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const floor = Math.max(currentHighest ?? 0, minimumPrice ?? 0);
  const step = suggestedStep(floor || 10);
  const [amount, setAmount] = useState(floor + step);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const belowFloor = amount <= floor;

  async function confirm() {
    setSubmitting(true);
    try {
      await onSubmit(amount);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease bid amount"
          onClick={() => setAmount((a) => Math.max(floor + step, a - step))}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 font-mono text-lg text-ink-950 hover:border-brass-500"
        >
          −
        </button>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="tabular-ticker h-11 w-full flex-1 rounded-lg border border-slate-200 bg-paper-100 px-3 text-center text-lg font-semibold text-ink-950 outline-none focus:border-2 focus:border-brass-500"
        />
        <button
          type="button"
          aria-label="Increase bid amount"
          onClick={() => setAmount((a) => a + step)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 font-mono text-lg text-ink-950 hover:border-brass-500"
        >
          +
        </button>
      </div>
      <span className="font-sans text-xs text-slate-500">
        {minimumPrice !== null
          ? `Must be above the current bid and reserve of ${formatMoney(minimumPrice)}.`
          : `Must be above the current bid of ${formatMoney(currentHighest)}.`}
      </span>
      {belowFloor && (
        <span className="font-sans text-xs text-ledger-red">
          Enter more than {formatMoney(floor)}.
        </span>
      )}
      {disabled && disabledReason && (
        <span className="font-sans text-xs text-slate-500">{disabledReason}</span>
      )}
      <Button
        disabled={disabled || belowFloor}
        onClick={() => setConfirmOpen(true)}
      >
        Place Bid
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm your bid">
        <p className="font-sans text-sm text-slate-500">
          You&apos;re about to bid{" "}
          <span className="tabular-ticker font-semibold text-ink-950">
            {formatMoney(amount)}
          </span>
          . This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="tertiary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={submitting}>
            {submitting ? "Placing…" : `Confirm ${formatMoney(amount)}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

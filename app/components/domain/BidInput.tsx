"use client";

import { useState } from "react";
import { Minus, Plus, Gavel, X, Check } from "lucide-react";
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
      <label htmlFor="bid-amount" className="text-[13px] text-muted">
        Your bid
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease bid amount"
          onClick={() => setAmount((a) => Math.max(floor + step, a - step))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-fg hover:bg-subtle"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id="bid-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="tabular-ticker h-12 w-full min-w-0 flex-1 rounded-[10px] border border-line bg-subtle px-3 text-center text-lg font-semibold text-fg outline-none focus:border-fg focus:bg-surface"
        />
        <button
          type="button"
          aria-label="Increase bid amount"
          onClick={() => setAmount((a) => a + step)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-fg hover:bg-subtle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <span className="text-xs text-muted">
        {minimumPrice !== null
          ? `Must be above the current bid and reserve of ${formatMoney(minimumPrice)}.`
          : `Must be above the current bid of ${formatMoney(currentHighest)}.`}{" "}
        Steps of <span className="tabular-ticker">{formatMoney(step)}</span>.
      </span>
      {belowFloor && <span className="text-xs text-danger">Enter more than {formatMoney(floor)}.</span>}
      {disabled && disabledReason && <span className="text-xs text-muted">{disabledReason}</span>}
      <Button icon={Gavel} disabled={disabled || belowFloor} onClick={() => setConfirmOpen(true)} className="w-full">
        Place Bid
      </Button>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm your bid">
        <div className="rounded-xl bg-subtle p-4">
          <span className="text-[13px] text-muted">Bid amount</span>
          <p className="tabular-ticker mt-1 text-[28px] font-semibold leading-none text-fg">{formatMoney(amount)}</p>
        </div>
        <p className="mt-3 text-sm text-muted">This can&apos;t be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" icon={X} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button icon={Check} onClick={confirm} disabled={submitting}>
            {submitting ? "Placing…" : `Confirm ${formatMoney(amount)}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

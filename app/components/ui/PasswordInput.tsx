"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldChrome, fieldClass } from "./Input";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  hint?: string;
};

export function PasswordInput({ label, error, hint, id, className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FieldChrome label={label} error={error} hint={hint} htmlFor={id!}>
      <div className="relative flex">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${fieldClass} w-full pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[10px] text-faint transition-colors hover:text-fg"
        >
          <Icon size={18} aria-hidden />
        </button>
      </div>
    </FieldChrome>
  );
}

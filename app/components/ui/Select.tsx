import type { SelectHTMLAttributes } from "react";
import { FieldChrome, fieldClass } from "./Input";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, className = "", children, ...props }: Props) {
  return (
    <FieldChrome label={label} error={error} htmlFor={id!}>
      <select id={id} className={`${fieldClass} ${className}`} {...props}>
        {children}
      </select>
    </FieldChrome>
  );
}

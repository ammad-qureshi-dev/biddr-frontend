import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const selectClass =
  "w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 transition-colors focus:outline-none focus:border-blue-500 cursor-pointer hover:border-gray-600";

export function Select({
  label,
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <select id={id} className={selectClass} {...props}>
        {children}
      </select>
    </div>
  );
}

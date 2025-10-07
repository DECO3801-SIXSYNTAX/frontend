import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
};

export function Input({ label, icon, className, ...props }: Props) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <div
        className={`flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 ${className ?? ""}`}
      >
        <input
          {...props}
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
        {icon && <div className="ml-2 text-gray-400">{icon}</div>}
      </div>
    </label>
  );
}

// Keep default export for backward compatibility
export default Input;
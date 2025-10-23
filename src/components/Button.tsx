import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  className?: string;
}

export default function Button({ label, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      {label}
    </button>
  );
}

import React from "react";
import { Link } from "react-router-dom";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  className?: string;
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
}

export function Button({ 
  label, 
  className = "", 
  asChild = false,
  size = "md",
  variant = "default",
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-lg"
  };
  
  const variantClasses = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    ghost: "text-gray-700 hover:bg-gray-100",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  if (asChild && children) {
    return (
      <div className={classes}>
        {children}
      </div>
    );
  }
  
  return (
    <button
      {...props}
      className={classes}
    >
      {label || children}
    </button>
  );
}

// Keep the default export for backward compatibility
export default function DefaultButton({ label, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      {label}
    </button>
  );
}
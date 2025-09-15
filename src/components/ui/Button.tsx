import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "subtle";

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2";
  const styles: Record<Variant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
    secondary: "bg-white border border-slate-300 hover:bg-slate-50 focus:ring-slate-300",
    subtle: "bg-slate-100 hover:bg-slate-200 focus:ring-slate-300",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

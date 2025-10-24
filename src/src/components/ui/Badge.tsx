
import { PropsWithChildren } from "react";

// --- Original Badge (default export, unchanged) ---
const colors: Record<string, string> = {
  Active: "bg-green-50 text-green-700 ring-green-600/20",
  Planning: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  Draft: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Archived: "bg-slate-100 text-slate-500 ring-slate-400/20",
  Suspended: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export default function Badge({ children }: PropsWithChildren) {
  const key = typeof children === "string" ? children : "default";
  const cls = colors[key] || "bg-slate-100 text-slate-700 ring-slate-500/20";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${cls}`}>{children}</span>;
}

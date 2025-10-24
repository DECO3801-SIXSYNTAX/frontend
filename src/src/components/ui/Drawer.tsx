import { PropsWithChildren } from "react";

export default function Drawer({
  open,
  title,
  onClose,
  children,
  width = 480,
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void; width?: number }>) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className="absolute top-0 right-0 h-full bg-white shadow-xl p-6 overflow-auto"
        style={{ width, transform: `translateX(${open ? 0 : width}px)`, transition: "transform 200ms ease-out" }}
      >
        <div className="mb-4 text-lg font-semibold">{title}</div>
        {children}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

export default function Topbar() {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">S</span>
          <span>SiPanit Admin</span>
        </Link>
        <div className="flex items-center gap-4">
          <input
            className="hidden sm:block w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Search"
          />
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
            🔔 <span className="sr-only">Notifications</span>
          </button>
          <Button variant="secondary" onClick={logout} className="text-sm">
            Logout
          </Button>
          <div className="h-8 w-8 rounded-full bg-slate-200" />
        </div>
      </div>
    </header>
  );
}

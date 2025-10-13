import { Link, useNavigate } from "react-router-dom";
import { signOut, isAuthenticated } from "@/lib/auth";

export default function Topbar() {
  const navigate = useNavigate();
  const onSignOut = () => { signOut(); navigate('/login'); };
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
          {isAuthenticated() ? (
            <button onClick={onSignOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">Sign out</button>
          ) : (
            <Link to="/login" className="text-sm text-blue-600 hover:underline">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}

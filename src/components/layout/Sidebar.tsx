import { NavLink } from "react-router-dom";

const link = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-blue-50 hover:text-blue-700";
const active = "bg-blue-100 text-blue-700";

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="p-4 space-y-1">
        <div className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500">Navigation</div>
        <Item to="/admin" icon="🏠" label="Dashboard" />
        <Item to="/admin/events" icon="📅" label="View Events" />
        <Item to="/admin/users" icon="👥" label="Manage Users" />
        <Item to="/admin/settings" icon="⚙️" label="System Settings" />
      </div>
    </aside>
  );

  function Item({ to, icon, label }: { to: string; icon: string; label: string }) {
    return (
      <NavLink to={to} className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
        <span>{icon}</span>
        <span>{label}</span>
      </NavLink>
    );
  }
}

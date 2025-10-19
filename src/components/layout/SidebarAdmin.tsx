import { NavLink } from "react-router-dom";

const link = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-blue-50 hover:text-blue-700";
const active = "bg-blue-100 text-blue-700";

interface SidebarAdminProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function SidebarAdmin({ isCollapsed = false }: SidebarAdminProps) {
  return (
    <aside className={`hidden md:block shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 space-y-1">
        {!isCollapsed && <div className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500">Navigation</div>}
        <Item to="/admin" icon="🏠" label="Dashboard" isCollapsed={isCollapsed} />
        <Item to="/admin/events" icon="📅" label="View Events" isCollapsed={isCollapsed} />
        <Item to="/admin/users" icon="👥" label="Manage Users" isCollapsed={isCollapsed} />
      </div>
    </aside>
  );

  function Item({ to, icon, label, isCollapsed }: { to: string; icon: string; label: string; isCollapsed: boolean }) {
    return (
      <NavLink to={to} className={({ isActive }) => `${link} ${isActive ? active : ""}`} title={isCollapsed ? label : undefined}>
        <span>{icon}</span>
        {!isCollapsed && <span>{label}</span>}
      </NavLink>
    );
  }
}

import { NavLink } from "react-router-dom";

const link = "flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-green-50 hover:text-green-700";
const active = "bg-green-100 text-green-700";

interface SidebarVendorProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function SidebarVendor({ isCollapsed = false }: SidebarVendorProps) {
  return (
    <aside className={`hidden md:block shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 space-y-1">
        {!isCollapsed && <div className="px-2 text-xs font-medium uppercase tracking-wide text-slate-500">Vendor Menu</div>}
        <Item to="/vendor" icon="🏠" label="Dashboard" isCollapsed={isCollapsed} />
        <Item to="/vendor/events" icon="📅" label="Assigned Events" isCollapsed={isCollapsed} />
        <Item to="/vendor/services" icon="🍽️" label="My Services" isCollapsed={isCollapsed} />
        <Item to="/vendor/orders" icon="📦" label="Orders" isCollapsed={isCollapsed} />
        <Item to="/vendor/schedule" icon="📆" label="Schedule" isCollapsed={isCollapsed} />
        <Item to="/vendor/payments" icon="💰" label="Payments" isCollapsed={isCollapsed} />
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

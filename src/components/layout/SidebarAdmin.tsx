import { NavLink } from "react-router-dom";

interface SidebarAdminProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function SidebarAdmin({ isCollapsed = false }: SidebarAdminProps) {
  return (
    <aside className={`hidden md:block shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4 space-y-1">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Admin Panel
          </div>
        )}
        <Item 
          to="/admin" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          } 
          label="Dashboard" 
          isCollapsed={isCollapsed} 
        />
        <Item 
          to="/admin/events" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          } 
          label="View Events" 
          isCollapsed={isCollapsed} 
        />
        <Item 
          to="/admin/users" 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } 
          label="Manage Users" 
          isCollapsed={isCollapsed} 
        />
      </div>
    </aside>
  );
}

function Item({ to, icon, label, isCollapsed }: { to: string; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
  return (
    <NavLink 
      to={to} 
      end={to === "/admin"}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
}

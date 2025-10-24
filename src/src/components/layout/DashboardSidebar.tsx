import { Calendar, Eye, Home } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/vendor", icon: Home },
  { name: "My Events", href: "/vendor/events", icon: Calendar },
  { name: "Seating View", href: "/vendor/seating", icon: Eye },
]

function handleSignOut() {
  // Clear all localStorage untuk menghindari konflik session
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.clear(); // Clear semua
  console.log('✓ Session cleared - logging out');
  window.location.href = '/signin';
}

export function DashboardSidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          // Match both exact path and child paths
          const isActive = 
            location.pathname === item.href || 
            location.pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
        {/* Sign Out menu item */}
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full mt-6"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
          <span>Sign Out</span>
        </button>
      </nav>
    </aside>
  )
}

export default DashboardSidebar;
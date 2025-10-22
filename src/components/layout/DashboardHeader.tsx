

import { Bell, User, LogOut, ChevronDown } from "lucide-react"
import Button from "../ui/Button"
import { useDashboard } from "../../contexts/DashboardContext"
import { useState, useRef, useEffect } from "react"

export function DashboardHeader() {
  const { currentUser } = useDashboard() || {}
  const name = currentUser?.name || currentUser?.fullName || currentUser?.username || "Vendor"
  const role = currentUser?.role || "Vendor"
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  function handleSignOut() {
    localStorage.removeItem('access_token');
    window.location.href = '/auth/sign-in';
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">SiPanit</h1>
            <p className="text-sm text-gray-500">Vendor Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-100 focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-sm text-left">
                <p className="font-medium text-gray-900">{name}</p>
                <p className="text-gray-500">{role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader;
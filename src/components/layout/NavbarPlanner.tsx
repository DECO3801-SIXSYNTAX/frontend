import React, { useState } from 'react';
import { Bell, Search, Settings, User, LogOut, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/contexts/DashboardContext';
import { signOut } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

const NavbarPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentPage, events } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/signin');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  const filteredResults = searchTerm.trim() ? events?.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.status.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5) : [];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        {/* Logo and Search */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">SP</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-indigo-600">SiPanit</span>
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events, guests, or activities..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pl-10 pr-10 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {isSearchFocused && searchTerm && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {filteredResults && filteredResults.length > 0 ? (
                  <>
                    {filteredResults.map((event) => (
                      <button
                        key={event.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate(`/planner/event-config/${event.id}`);
                          clearSearch();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500">{event.venue} • {event.status}</div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No events found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/planner/settings')}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="App Settings"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* User profile section */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {currentUser?.name || 'Event Planner'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser?.role || 'Planner'}
              </p>
            </div>

            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-50 border-2 border-transparent hover:border-primary-200 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </motion.button>

              {/* Enhanced Dropdown menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">{currentUser?.name || 'Event Planner'}</p>
                  <p className="text-sm text-gray-500">{currentUser?.email || 'planner@sipanit.com'}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full capitalize">
                    {currentUser?.role || 'Planner'}
                  </span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => navigate('/planner/settings')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    App Preferences
                  </button>
                </div>

                <hr className="my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default NavbarPlanner;

import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Activity,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '../../contexts/DashboardContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { currentPage, setCurrentPage, events } = useDashboard();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      page: 'dashboard' as const,
      active: currentPage === 'dashboard'
    },
    {
      id: 'events',
      label: 'All Events',
      icon: Calendar,
      page: 'events-list' as const,
      active: currentPage === 'events-list'
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: Activity,
      page: 'activity-log' as const,
      active: currentPage === 'activity-log'
    },
    {
      id: 'layout-editor',
      label: 'Layout Editor',
      icon: BarChart3,
      page: null,
      active: false,
      disabled: true
    },
    {
      id: 'reports',
      label: 'Export Reports',
      icon: FileText,
      page: null,
      active: false,
      disabled: true
    }
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <div className="flex justify-end p-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 pb-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => item.page && setCurrentPage(item.page)}
                disabled={item.disabled}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  item.active
                    ? 'bg-primary-50 text-primary-600 border border-primary-200'
                    : item.disabled
                    ? 'text-gray-400 hover:bg-gray-50 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {!isCollapsed && item.disabled && (
                  <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Bottom section */}
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentPage('event-settings')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              currentPage === 'event-settings' || currentPage.startsWith('event-config-')
                ? 'bg-primary-50 text-primary-600 border border-primary-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
            }`}
            title="Event Settings"
          >
            <Settings className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
            {!isCollapsed && <span className="font-medium">Event Settings</span>}
          </motion.button>
        </div>


        {/* Quick Stats (when not collapsed) */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg"
          >
            <h4 className="font-semibold text-sm mb-3">Quick Stats</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Active Events</span>
                <span className="font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                  {events ? events.filter(event =>
                    event.status === 'active' ||
                    event.status === 'confirmed' ||
                    event.status === 'planning'
                  ).length : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                  {events ? events.filter(event => {
                    const eventDate = new Date(event.startDate);
                    const now = new Date();
                    return eventDate.getMonth() === now.getMonth() &&
                           eventDate.getFullYear() === now.getFullYear();
                  }).length : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Events</span>
                <span className="font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                  {events ? events.length : 0}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </motion.div>
  );
};

export default Sidebar;
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Activity,
  FileText,
  Layout as LayoutIcon,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/contexts/DashboardContext';

interface SidebarPlannerProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const SidebarPlanner: React.FC<SidebarPlannerProps> = ({ 
  isCollapsed = false, 
  setIsCollapsed = () => {} 
}) => {
  const { currentPage, setCurrentPage, events } = useDashboard();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/planner',
      active: currentPage === 'dashboard'
    },
    {
      id: 'events',
      label: 'All Events',
      icon: Calendar,
      to: '/planner/events',
      active: currentPage === 'events-list'
    },
    {
      id: 'guest-management',
      label: 'Guest Management',
      icon: Users,
      to: '/planner/guest-management',
      active: currentPage === 'guest-management'
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: Activity,
      to: '/planner/activity-log',
      active: currentPage === 'activity-log'
    },
    {
      id: 'layout-editor',
      label: 'Layout Editor',
      icon: LayoutIcon,
      to: '/planner/event-list-for-layout',
      active: currentPage === 'event-list-for-layout' || currentPage.startsWith('layout-editor'),
      disabled: false
    },
    {
      id: 'event-settings',
      label: 'Event Settings',
      icon: Settings,
      to: '/planner/event-settings',
      active: currentPage === 'event-settings'
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
              <NavLink
                key={item.id}
                to={item.disabled ? '#' : item.to}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  }
                }}
                className={({ isActive }) => `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  isActive && !item.disabled
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
              </NavLink>
            );
          })}
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
                    event.status === 'planning' ||
                    event.status === 'confirmed'
                  ).length : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                  {events ? events.filter(event => {
                    const eventDate = new Date(event.startDate || event.endDate || '');
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

export default SidebarPlanner;

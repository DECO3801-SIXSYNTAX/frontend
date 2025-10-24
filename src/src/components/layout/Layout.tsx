import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NavbarPlanner from './NavbarPlanner';
import SidebarPlanner from './SidebarPlanner';
import FooterPlanner from './FooterPlanner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SidebarPlanner
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <NavbarPlanner />

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 p-6 overflow-auto"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <FooterPlanner />
      </div>
    </div>
  );
};

export default Layout;
import React from 'react';
import { Heart, Github, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

const FooterPlanner: React.FC = () => {
  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white border-t border-gray-200 px-6 py-4 mt-auto"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Copyright */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>© 2024 SiPanit. Made with</span>
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span>for event planners</span>
        </div>

        {/* Center - Version info */}
        <div className="text-xs text-gray-400">
          Version 1.0.0 • Last updated: Oct 18, 2024
        </div>

        {/* Right side - Social links */}
        <div className="flex items-center space-x-3">
          <motion.a
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Github className="w-4 h-4" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <Twitter className="w-4 h-4" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Linkedin className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </motion.footer>
  );
};

export default FooterPlanner;

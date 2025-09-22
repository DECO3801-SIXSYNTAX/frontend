import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, User, Shield, Settings } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
}

interface CollaborationMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'planner' | 'vendor' | 'viewer' | 'editor';
  status?: 'online' | 'away' | 'offline';
  permissions?: {
    editLayout: boolean;
    manageGuests: boolean;
    exportData: boolean;
  };
  addedAt?: string;
  addedBy?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (member: CollaborationMember) => void;
  existingMembers: CollaborationMember[];
  eventId: string;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  existingMembers,
  eventId
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'planner' | 'vendor' | 'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      value: 'viewer' as const,
      label: 'Viewer',
      description: 'Can view event details and guest lists',
      icon: User
    },
    {
      value: 'editor' as const,
      label: 'Editor',
      description: 'Can edit event details and manage guests',
      icon: Settings
    },
    {
      value: 'admin' as const,
      label: 'Admin',
      description: 'Full access including member management',
      icon: Shield
    }
  ] as const;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:3002'}/users`);
      if (response.ok) {
        const allUsers = await response.json();
        setUsers(allUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const existingMemberIds = existingMembers.map(member => member.id);
  const availableUsers = users.filter(user =>
    !existingMemberIds.includes(user.id) &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddMember = (user: User) => {
    const newMember: CollaborationMember = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: selectedRole,
      status: 'online',
      addedAt: new Date().toISOString(),
      addedBy: 'current-user-id', // In real app, this would come from auth context
      permissions: {
        editLayout: selectedRole === 'admin' || selectedRole === 'editor',
        manageGuests: selectedRole === 'admin' || selectedRole === 'editor',
        exportData: selectedRole === 'admin'
      }
    };

    onAddMember(newMember);
    onClose();
    setSearchTerm('');
    setSelectedRole('viewer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity"
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Add Team Member
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add existing users to collaborate on this event
                    </p>
                  </div>

                  {/* Search */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Default Role
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                          <button
                            key={role.value}
                            onClick={() => setSelectedRole(role.value)}
                            className={`p-3 text-left border-2 rounded-lg transition-colors ${
                              selectedRole === role.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              <Icon className="h-4 w-4 mr-2 text-gray-600" />
                              <span className="font-medium text-gray-900">{role.label}</span>
                            </div>
                            <p className="text-xs text-gray-500">{role.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* User List */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Available Users ({availableUsers.length})
                    </label>

                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading users...</p>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {searchTerm ? 'No users found matching your search' : 'All users are already members'}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {availableUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                {user.company && (
                                  <p className="text-xs text-gray-400">{user.company}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMember(user)}
                              className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
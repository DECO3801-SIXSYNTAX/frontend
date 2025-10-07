import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Users,
  UserPlus,
  Search,
  Filter,
  Clock,
  User,
  Eye,
  Download
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { Activity as ActivityType } from '../types/dashboard';

const ActivityLog: React.FC = () => {
  const { activities, setCurrentPage, teamMembers, events } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const activityTypes = [
    { value: 'event', label: 'Event Actions', icon: Calendar },
    { value: 'guest', label: 'Guest Management', icon: Users },
    { value: 'team', label: 'Team Changes', icon: UserPlus },
  ];

  const filteredActivities = useMemo(() => {
    let filtered = activities.filter(activity => {
      const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.userName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUser = userFilter === 'all' || activity.userId === userFilter;
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const activityDate = new Date(activity.timestamp);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            matchesDate = activityDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = activityDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesUser && matchesType && matchesDate;
    });

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, searchTerm, userFilter, typeFilter, dateFilter]);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event': return Calendar;
      case 'guest': return Users;
      case 'team': return UserPlus;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-600';
      case 'guest': return 'bg-green-100 text-green-600';
      case 'team': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventName = (eventId: string | null) => {
    if (!eventId) return null;
    const event = events.find(e => e.id === eventId);
    return event?.name || 'Unknown Event';
  };

  const exportActivities = () => {
    const csvContent = [
      ['Date', 'User', 'Action', 'Details', 'Type', 'Event'].join(','),
      ...filteredActivities.map(activity => [
        formatFullDate(activity.timestamp),
        activity.userName,
        activity.action,
        activity.details,
        activity.type,
        getEventName(activity.eventId) || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
            <p className="text-gray-600">{filteredActivities.length} activities found</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportActivities}
          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Export</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* User Filter */}
          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Users</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {activityTypes.map(type => {
          const count = filteredActivities.filter(a => a.type === type.value).length;
          const Icon = type.icon;

          return (
            <motion.div
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{type.label}</p>
                  <p className="text-xl font-bold text-gray-800">{count}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(type.value)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-xl font-bold text-gray-800">{filteredActivities.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const eventName = getEventName(activity.eventId);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-800">
                            {activity.userName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {activity.action.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {activity.details}
                      </p>

                      {eventName && (
                        <div className="mt-2 flex items-center text-xs text-indigo-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          Event: {eventName}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          activity.type === 'event' ? 'bg-blue-100 text-blue-700' :
                          activity.type === 'guest' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>

                        <span className="text-xs text-gray-400">
                          {formatFullDate(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No activities found</h3>
              <p className="text-gray-600">
                {searchTerm || userFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters to see more activities'
                  : 'Activities will appear here as team members interact with the system'
                }
              </p>
            </div>
          )}
        </div>

        {/* Load More (if needed) */}
        {filteredActivities.length > 50 && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Load more activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
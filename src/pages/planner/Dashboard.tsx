import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Upload,
  UserPlus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { DashboardService } from '../../services/DashboardService';
import CreateEventModal from '../../components/modals/CreateEventModal';
import ImportGuestsModal from '../../components/modals/ImportGuestsModal';
import InviteTeamModal from '../../components/modals/InviteTeamModal';
import { Event, EventStatistics } from '../../types/dashboard';

const Dashboard: React.FC = () => {
  const { events, setEvents, activities, refreshData, currentUser, setCurrentPage } = useDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportGuestsModalOpen, setIsImportGuestsModalOpen] = useState(false);
  const [isInviteTeamModalOpen, setIsInviteTeamModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [statistics, setStatistics] = useState<EventStatistics>({
    totalGuests: 0,
    assignedSeats: 0,
    dietaryNeeds: 0,
    accessibilityNeeds: 0,
    completionRate: 0
  });
  const [eventBreakdown, setEventBreakdown] = useState<Array<{
    eventId: string;
    eventName: string;
    totalGuests: number;
    assignedSeats: number;
    dietaryNeeds: number;
    accessibilityNeeds: number;
    startDate: string;
    status: string;
  }>>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dashboardService = new DashboardService();

  useEffect(() => {
    loadStatistics();
  }, [events]);

  const loadStatistics = async () => {
    try {
      const [stats, breakdown] = await Promise.all([
        dashboardService.getEventStatistics(),
        dashboardService.getEventStatisticsBreakdown()
      ]);
      setStatistics(stats);
      setEventBreakdown(breakdown);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    // Set time to start of day for fair comparison with date-only strings
    today.setHours(0, 0, 0, 0);

    return events
      .filter(event => {
        const eventDate = new Date(event.startDate);
        // If it's a date-only string, set time to start of day
        if (!event.startDate.includes('T')) {
          eventDate.setHours(0, 0, 0, 0);
        }
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  };

  const getRecentActivities = () => {
    return activities.slice(0, 5);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dashboardService.deleteEvent(eventId, currentUser?.id || '');
        await refreshData();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleChangeStatus = async (event: Event, newStatus: 'DRAFT' | 'PUBLISHED') => {
    // Close dropdown immediately for better UX
    setActiveDropdown(null);

    // Optimistically update the UI immediately
    const updatedEvents = events.map(e =>
      e.id === event.id ? { ...e, status: newStatus } : e
    );
    setEvents(updatedEvents);

    try {
      await dashboardService.updateEvent(
        event.id,
        { ...event, status: newStatus },
        currentUser?.id || ''
      );
      // Refresh to get the latest data from server
      await refreshData();
    } catch (error) {
      console.error('Error changing event status:', error);
      // Revert the optimistic update on error
      await refreshData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'PUBLISHED': return 'bg-green-100 text-green-700';
      // Keep old statuses for backward compatibility during transition
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'done': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.name || 'John'}! Here's what's happening with your events.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </motion.button>
      </div>

      {/* Overall Statistics Cards */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-800">Overall Statistics</h2>
        <p className="text-sm text-gray-600">Aggregated data across all events</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guests</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.totalGuests.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned Seats</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.assignedSeats.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dietary Needs</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.dietaryNeeds}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accessibility</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.accessibilityNeeds}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-800">{statistics.completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Event Statistics Breakdown */}
      {eventBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Event Statistics Breakdown</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed statistics for each event</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Guests
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Seats
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dietary Needs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accessibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventBreakdown.map((event, index) => (
                  <motion.tr
                    key={event.eventId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{formatDate(event.startDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">{event.totalGuests}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">{event.assignedSeats}</span>
                        <span className="text-xs text-gray-500">
                          ({event.totalGuests > 0 ? Math.round((event.assignedSeats / event.totalGuests) * 100) : 0}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">{event.dietaryNeeds}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">{event.accessibilityNeeds}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
                <button
                  onClick={() => setCurrentPage('events-list')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="p-6">
              {getUpcomingEvents().length > 0 ? (
                <div className="space-y-4">
                  {getUpcomingEvents().map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 border-l-4 ${getPriorityColor(event.priority)} bg-gray-50 rounded-r-lg`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{event.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(event.startDate)}
                            </span>
                            <span className="flex items-center text-sm text-gray-500">
                              <Users className="w-4 h-4 mr-1" />
                              {event.expectedAttendees} guests
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === event.id ? null : event.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === event.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  setEditingEvent(event);
                                  setIsCreateModalOpen(true);
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Edit
                              </button>

                              {/* Status change options */}
                              <div className="border-t border-gray-100">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                  Change Status
                                </div>
                                {event.status !== 'DRAFT' && (
                                  <button
                                    onClick={() => handleChangeStatus(event, 'DRAFT')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
                                    Mark as Draft
                                  </button>
                                )}
                                {event.status !== 'PUBLISHED' && (
                                  <button
                                    onClick={() => handleChangeStatus(event, 'PUBLISHED')}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-green-400 mr-3"></div>
                                    Mark as Published
                                  </button>
                                )}
                              </div>

                              <div className="border-t border-gray-100">
                                <button
                                  onClick={() => {
                                    handleDeleteEvent(event.id);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming events</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2"
                  >
                    Create your first event
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsImportGuestsModalOpen(true)}
                className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Upload className="w-5 h-5" />
                <span>Import Guests</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsInviteTeamModalOpen(true)}
                className="w-full flex items-center space-x-3 p-3 bg-green-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <UserPlus className="w-5 h-5" />
                <span>Invite Team Member</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                <button
                  onClick={() => setCurrentPage('activity-log')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getRecentActivities().map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.userName}</span>{' '}
                        {activity.action.toLowerCase()} {activity.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
        }}
        editEvent={editingEvent}
      />

      {/* Import Guests Modal */}
      <ImportGuestsModal
        isOpen={isImportGuestsModalOpen}
        onClose={() => setIsImportGuestsModalOpen(false)}
      />

      {/* Invite Team Modal */}
      <InviteTeamModal
        isOpen={isInviteTeamModalOpen}
        onClose={() => setIsInviteTeamModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
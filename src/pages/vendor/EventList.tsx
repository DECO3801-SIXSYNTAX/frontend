import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Users, Eye, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: string;
  attendees: number;
  description?: string;
  collaborators?: string[];
}

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('→ [EventList] Loading events for vendor');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ No user logged in');
        setEvents([]);
        setLoading(false);
        return;
      }

      const currentFirebaseUid = currentUser.uid;
      const currentUserEmail = currentUser.email;
      
      // Get Django User ID from localStorage
      let djangoUserId = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          djangoUserId = user.id;
        }
      } catch (err) {
        console.error('❌ Could not get user from localStorage:', err);
      }
      
      console.log('→ Vendor identifiers:', {
        firebaseUid: currentFirebaseUid,
        djangoId: djangoUserId,
        email: currentUserEmail
      });
      
      // Fetch ALL events from Firestore (not filtered by createdBy)
      const { db } = await import('../../config/firebase');
      const eventsRef = collection(db, 'events');
      const snapshot = await getDocs(eventsRef);
      
      const allEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          venue: data.venue || '',
          date: data.startDate || data.date || '',
          status: data.status || '',
          attendees: data.expectedAttendees || data.attendees || 0,
          description: data.description || '',
          collaborators: data.collaborators || [],
        } as Event;
      });
      
      console.log('✓ Total events in Firestore:', allEvents.length);
      
      // Filter events where vendor is collaborator
      const vendorEvents = allEvents.filter(event => {
        const collaborators = event.collaborators || [];
        return collaborators.some((collab: any) => {
          if (typeof collab === 'string') {
            return collab === currentFirebaseUid || 
                   collab === djangoUserId || 
                   collab === currentUserEmail;
          }
          return false;
        });
      });
      
      console.log('✓ Events assigned to vendor:', vendorEvents.length);
      
      setEvents(vendorEvents);
      setFilteredEvents(vendorEvents);
      setError(null);
    } catch (err: any) {
      console.error('✗ Error loading events:', err);
      setError('Failed to load events');
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter((event) => 
        event.status.toUpperCase() === statusFilter.toUpperCase() ||
        event.status === statusFilter
      );
    }

    setFilteredEvents(filtered);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'ACTIVE' || status === 'Active') {
      return 'bg-green-100 text-green-800';
    }
    if (upperStatus === 'UPCOMING' || status === 'Upcoming') {
      return 'bg-blue-100 text-blue-800';
    }
    if (upperStatus === 'COMPLETED' || status === 'Completed') {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusDot = (status?: string) => {
    if (!status) return 'bg-gray-500';
    
    const upperStatus = status.toUpperCase();
    if (upperStatus === 'ACTIVE' || status === 'Active') return 'bg-green-500';
    if (upperStatus === 'UPCOMING' || status === 'Upcoming') return 'bg-blue-500';
    if (upperStatus === 'COMPLETED' || status === 'Completed') return 'bg-gray-500';
    return 'bg-yellow-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-lg text-gray-600">
            View and manage all your assigned events
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Upcoming</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredEvents.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{events.length}</span> events
          </div>
        </motion.div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'All Status'
                ? 'Try adjusting your search or filters'
                : 'No events have been assigned to you yet'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/vendor/seating/${event.id}`}>
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
                    {/* Card Header with gradient */}
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <div className="absolute top-4 right-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            event.status
                          )} backdrop-blur-sm bg-white bg-opacity-90`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${getStatusDot(event.status)} mr-1.5 animate-pulse`}
                          ></span>
                          {event.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {event.name}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{event.attendees || 0} guests</span>
                        </div>
                      </div>

                      {/* View Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                          View Details
                        </span>
                        <Eye className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventList;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { DashboardService } from '../../services/DashboardService';
import { auth } from '../../config/firebase';

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  status: string;
  attendees: number;
  collaborators?: string[];
}

export function VendorDashboard() {
  const { currentUser } = useDashboard();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dashboardService = new DashboardService();

  useEffect(() => {
    loadEvents();
  }, []);

// frontend/src/pages/vendor/VendorDashboard.tsx

// frontend/src/pages/vendor/VendorDashboard.tsx

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('🔍 ===== VENDOR DASHBOARD: LOADING EVENTS =====');
      
      // Get current user ID from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('❌ No user logged in');
        setEvents([]);
        setLoading(false);
        return;
      }

      const currentFirebaseUid = currentUser.uid;
      const currentUserEmail = currentUser.email;
      console.log('✅ Current vendor Firebase UID:', currentFirebaseUid);
      console.log('✅ Current vendor email:', currentUserEmail);
      
      // CARA 1: Ambil Django User ID dari localStorage (paling cepat)
      let djangoUserId = null;
      try {
        const userStr = localStorage.getItem('user');
        console.log('📦 localStorage user:', userStr);
        
        if (userStr) {
          const user = JSON.parse(userStr);
          djangoUserId = user.id;
          console.log('✅ Django User ID from localStorage:', djangoUserId);
        } else {
          console.warn('⚠️ No user in localStorage');
        }
      } catch (err) {
        console.error('❌ Could not get user from localStorage:', err);
      }
      
      // CARA 2 (Fallback): Ambil dari Firestore jika tidak ada di localStorage
      if (!djangoUserId) {
        console.log('🔄 Trying to get Django ID from Firestore...');
        try {
          const { db } = await import('../../config/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          
          const userDocRef = doc(db, 'users', currentFirebaseUid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const firestoreUser = userDoc.data();
            djangoUserId = firestoreUser.djangoId || firestoreUser.id;
            console.log('✅ Django User ID from Firestore:', djangoUserId);
          } else {
            console.warn('⚠️ User not found in Firestore');
          }
        } catch (err) {
          console.error('❌ Could not fetch from Firestore:', err);
        }
      }
      
      console.log('📊 Identifiers to check:');
      console.log('  - Firebase UID:', currentFirebaseUid);
      console.log('  - Django ID:', djangoUserId);
      console.log('  - Email:', currentUserEmail);
      
      // PENTING: Untuk vendor, ambil SEMUA events dari Firestore
      // JANGAN gunakan dashboardService.getEvents() karena itu filter by createdBy
      console.log('🔍 Fetching ALL events from Firestore (not filtered by createdBy)...');
      
      const { db } = await import('../../config/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
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
          collaborators: data.collaborators || [],
          description: data.description || '',
          startDate: data.startDate,
          endDate: data.endDate,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Event;
      });
      
      console.log('✅ Total events in Firestore:', allEvents.length);
      
      // Debug: Log all events with their collaborators
      allEvents.forEach((event, index) => {
        console.log(`📋 Event ${index + 1}: ${event.name}`);
        console.log('   ID:', event.id);
        console.log('   Collaborators:', event.collaborators);
      });
      
      // Filter events where vendor is in collaborators array
      const vendorEvents = allEvents.filter(event => {
        const collaborators = event.collaborators || [];
        console.log(`\n🔍 Checking event: ${event.name}`);
        console.log('   Collaborators array:', collaborators);
        
        // Check berbagai kemungkinan format
        const isCollaborator = collaborators.some((collab: any) => {
          if (typeof collab === 'string') {
            const matchFirebase = collab === currentFirebaseUid;
            const matchDjango = collab === djangoUserId;
            const matchEmail = collab === currentUserEmail;
            
            console.log(`   Checking collaborator: ${collab}`);
            console.log(`     Match Firebase UID? ${matchFirebase}`);
            console.log(`     Match Django ID? ${matchDjango}`);
            console.log(`     Match Email? ${matchEmail}`);
            
            return matchFirebase || matchDjango || matchEmail;
          }
          
          // Jika collab adalah object (untuk future compatibility)
          if (typeof collab === 'object' && collab !== null) {
            const matchFirebase = collab.firebase_uid === currentFirebaseUid;
            const matchDjango = collab.django_id === djangoUserId;
            const matchEmail = collab.email === currentUserEmail;
            
            console.log(`   Checking collaborator object:`, collab);
            console.log(`     Match Firebase UID? ${matchFirebase}`);
            console.log(`     Match Django ID? ${matchDjango}`);
            console.log(`     Match Email? ${matchEmail}`);
            
            return matchFirebase || matchDjango || matchEmail;
          }
          
          return false;
        });
        
        if (isCollaborator) {
          console.log(`   ✅ MATCH! Vendor is collaborator of: ${event.name}`);
        } else {
          console.log(`   ❌ NO MATCH for: ${event.name}`);
        }
        
        return isCollaborator;
      });
      
      console.log('\n📊 ===== FINAL RESULTS =====');
      console.log('✅ Total events in Firestore:', allEvents.length);
      console.log('✅ Events vendor is assigned to:', vendorEvents.length);
      
      if (vendorEvents.length > 0) {
        console.log('✅ Assigned events:');
        vendorEvents.forEach(event => {
          console.log(`   - ${event.name}`);
        });
      } else {
        console.warn('⚠️ No events found for this vendor!');
        console.warn('⚠️ Make sure the collaborator ID matches one of these:');
        console.warn('   - Firebase UID:', currentFirebaseUid);
        console.warn('   - Django ID:', djangoUserId);
        console.warn('   - Email:', currentUserEmail);
      }
      
      setEvents(vendorEvents);
      setError(null);
    } catch (err: any) {
      console.error('❌ ===== ERROR LOADING EVENTS =====');
      console.error(err);
      setError('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  // Calculate stats from real data
  const totalEvents = events.length;
  const activeEvents = events.filter(e => e.status === 'ACTIVE' || e.status === 'Active').length;
  const upcomingEvents = events.filter(e => e.status === 'UPCOMING' || e.status === 'Upcoming').length;
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendees || 0), 0);

  const stats = [
    {
      name: 'Total Events',
      value: totalEvents.toString(),
      icon: Calendar,
      change: `${totalEvents} assigned to you`,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500'
    },
    {
      name: 'Active Events',
      value: activeEvents.toString(),
      icon: TrendingUp,
      change: 'Currently ongoing',
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500'
    },
    {
      name: 'Upcoming',
      value: upcomingEvents.toString(),
      icon: Clock,
      change: 'Scheduled events',
      color: 'bg-purple-50 text-purple-600',
      bgColor: 'bg-purple-500'
    },
    {
      name: 'Total Guests',
      value: totalAttendees.toLocaleString(),
      icon: Users,
      change: 'Across all events',
      color: 'bg-orange-50 text-orange-600',
      bgColor: 'bg-orange-500'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading dashboard...</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser?.name || 'Vendor'}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Here's what's happening with your events
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${stat.bgColor} animate-pulse`}></div>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/vendor/events">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            >
              <Calendar className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">View All Events</h3>
              <p className="text-blue-100 text-sm">
                Browse and manage all your assigned events
              </p>
              <div className="mt-4 flex items-center text-sm font-medium">
                <span>Go to Events</span>
                <span className="ml-2">→</span>
              </div>
            </motion.div>
          </Link>

          <Link to="/vendor/seating">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            >
              <Eye className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-xl font-bold mb-2">Seating View</h3>
              <p className="text-green-100 text-sm">
                View real-time seating arrangements and guest lists
              </p>
              <div className="mt-4 flex items-center text-sm font-medium">
                <span>Open Seating</span>
                <span className="ml-2">→</span>
              </div>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <CheckCircle className="h-6 w-6 opacity-75" />
            </div>
            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
            <p className="text-purple-100 text-sm mb-4">
              Contact support for assistance
            </p>
            <button className="text-sm font-medium underline hover:no-underline">
              Get Support →
            </button>
          </motion.div>
        </div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              <Link
                to="/vendor/events"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
              >
                View All
                <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-600 mb-2">No events assigned yet</p>
              <p className="text-sm text-gray-500">
                Contact your event planner for access
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.slice(0, 5).map((event, index) => {
                const statusConfig =
                  event.status === 'ACTIVE' || event.status === 'Active'
                    ? { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' }
                    : event.status === 'UPCOMING' || event.status === 'Upcoming'
                    ? { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' }
                    : { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/vendor/seating/${event.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {event.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1.5`}></span>
                            {event.status}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span>{event.attendees || 0} guests</span>
                          </div>
                        </div>
                      </div>
                      <Eye className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default VendorDashboard;
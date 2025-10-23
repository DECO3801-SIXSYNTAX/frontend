import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  MapPin,
  Layout as LayoutIcon,
  Plus,
  Search,
  ArrowLeft,
  Eye,
  Edit,
  X,
  UserPlus,
  Mail,
  Trash2  // TAMBAHKAN INI
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { FloorPlanService, FloorPlan } from '../../services/FloorPlanService';
import { auth } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const EventListForLayout: React.FC = () => {
  const navigate = useNavigate();
  const { events, setCurrentPage } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingLayout, setViewingLayout] = useState<string | null>(null);
  const [inviteVendorModal, setInviteVendorModal] = useState<string | null>(null);
  const [vendorEmail, setVendorEmail] = useState('');

  const floorPlanService = new FloorPlanService();
  const [floorPlanStatus, setFloorPlanStatus] = useState<{[eventId: string]: boolean}>({});
  const [collaborators, setCollaborators] = useState<Array<{id: string, email: string, name: string}>>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  useEffect(() => {
    checkFloorPlans();
  }, [events]);

  const checkFloorPlans = async () => {
    try {
      const status: {[eventId: string]: boolean} = {};

      // Check each event for floor plan
      for (const event of events) {
        try {
          const plan = await floorPlanService.getFloorPlanByEventId(event.id);
          status[event.id] = plan !== null;
        } catch (error) {
          status[event.id] = false;
        }
      }

      setFloorPlanStatus(status);
    } catch (error) {
      console.error('Error checking floor plans:', error);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasFloorPlan = (eventId: string) => {
    return floorPlanStatus[eventId] || false;
  };

  const handleEventSelect = (eventId: string) => {
    if (hasFloorPlan(eventId)) {
      // Navigate to view layout page
      setCurrentPage(`view-layout-${eventId}`);
      navigate(`/planner/view-layout/${eventId}`);
    } else {
      // Navigate to layout editor with the selected event
      setCurrentPage(`layout-editor-${eventId}`);
      navigate(`/planner/layout-editor/${eventId}`);
    }
  };

  const handleEditLayout = (eventId: string) => {
    setCurrentPage(`layout-editor-${eventId}`);
    navigate(`/planner/layout-editor/${eventId}`);
  };

  const handleViewLayout = (eventId: string) => {
    setCurrentPage(`view-layout-${eventId}`);
    navigate(`/planner/view-layout/${eventId}`);
  };

  const handleInviteVendor = async () => {
    if (!vendorEmail.trim() || !inviteVendorModal) return;

    try {
      // Get Firebase Auth token
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        alert('Authentication required. Please login again.');
        navigate('/signin');
        return;
      }

      // Get Firebase ID token
      const token = await currentUser.getIdToken();
      
      console.log('Inviting vendor:', vendorEmail);

      // PERBAIKAN: Ubah dari /api/events/ ke /api/event/ (singular)
      const response = await fetch(
        `http://localhost:8000/api/event/${inviteVendorModal}/invite-vendor/`,  // ← UBAH INI
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: vendorEmail.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401 || response.status === 403) {
          alert('Session expired. Please login again.');
          navigate('/signin');
          return;
        }
        
        throw new Error(errorData.detail || 'Failed to invite vendor');
      }

      const result = await response.json();
      
      alert(`Successfully invited ${vendorEmail} to the event!\n\nThe vendor can now view this event in their dashboard.`);
      
      // Reload collaborators list
      await loadCollaborators(inviteVendorModal);
      
      // Reset email input
      setVendorEmail('');
      
      console.log('✓ Vendor invited successfully:', result);
    } catch (error: any) {
      console.error('✗ Error inviting vendor:', error);
      alert(`Failed to invite vendor: ${error.message}`);
    }
  };
  const loadCollaborators = async (eventId: string) => {
    try {
      setLoadingCollaborators(true);
      
      const { db } = await import('@/config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Get event from Firestore
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        console.error('Event not found');
        return;
      }
      
      const eventData = eventDoc.data();
      const collaboratorIds = eventData.collaborators || [];
      
      console.log('Event collaborators:', collaboratorIds);
      
      // Fetch all collaborator details from Firestore
      if (collaboratorIds.length > 0) {
        const userPromises = collaboratorIds.map(async (userId: string) => {
          try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                email: userData.email || '',
                name: userData.name || userData.email
              };
            }
          } catch (err) {
            console.error('Error fetching user:', userId, err);
          }
          return null;
        });
        
        const users = await Promise.all(userPromises);
        setCollaborators(users.filter(u => u !== null) as Array<{id: string, email: string, name: string}>);
      } else {
        setCollaborators([]);
      }
      
    } catch (error) {
      console.error('Error loading collaborators:', error);
      setCollaborators([]);
    } finally {
      setLoadingCollaborators(false);
    }
  };
  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorEmail: string) => {
    if (!inviteVendorModal) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${collaboratorEmail} from this event?\n\nThey will no longer be able to view this event.`
    );

    if (!confirmed) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Authentication required. Please login again.');
        navigate('/signin');
        return;
      }

      const token = await currentUser.getIdToken();

      console.log('Removing collaborator:', collaboratorEmail);

      // PERBAIKAN: Ubah dari /api/events/ ke /api/event/
      const response = await fetch(
        `http://localhost:8000/api/event/${inviteVendorModal}/remove-collaborator/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: collaboratorId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to remove collaborator');
      }

      alert(`Successfully removed ${collaboratorEmail} from the event.`);
      
      await loadCollaborators(inviteVendorModal);
      
      console.log('✓ Collaborator removed successfully');
    } catch (error: any) {
      console.error('✗ Error removing collaborator:', error);
      alert(`Failed to remove collaborator: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'done': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage('dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Layout Editor</h1>
              <p className="text-gray-600">Select an event to design its floor plan layout</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events by name or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleEventSelect(event.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              >
                {/* Event Header with Gradient */}
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500 p-4 flex items-center justify-between">
                  <div className="text-white">
                    <h3 className="font-semibold text-lg truncate">{event.name}</h3>
                    <p className="text-indigo-100 text-sm flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                  <LayoutIcon className="w-8 h-8 text-white opacity-50" />
                </div>

                {/* Event Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{event.expectedAttendees} expected attendees</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                      {hasFloorPlan(event.id) && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Has Layout
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasFloorPlan(event.id) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInviteVendorModal(event.id);
                            loadCollaborators(event.id);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Invite
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                      >
                        <LayoutIcon className="w-4 h-4 mr-1" />
                        {hasFloorPlan(event.id) ? 'View' : 'Design'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create an event to start designing its layout'}
              </p>
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage('dashboard')}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Go to Dashboard</span>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* View Layout Modal */}
        {viewingLayout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewingLayout(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Floor Plan Layout</h2>
                    <p className="text-indigo-100 mt-1">
                      {events.find(e => e.id === viewingLayout)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setViewingLayout(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <LayoutIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Layout Exists</h3>
                  <p className="text-gray-600 mb-6">
                    A floor plan layout has been created for this event. Click edit to make changes.
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleEditLayout(viewingLayout);
                        setViewingLayout(null);
                      }}
                      className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                    >
                      <Edit className="w-5 h-5" />
                      <span>Edit Layout</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewingLayout(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Invite Vendor Modal */}
        {inviteVendorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setInviteVendorModal(null);
              setCollaborators([]);
              setVendorEmail('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserPlus className="w-6 h-6" />
                    <div>
                      <h2 className="text-xl font-bold">Manage Vendors</h2>
                      <p className="text-green-100 text-sm mt-1">
                        {events.find(e => e.id === inviteVendorModal)?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setInviteVendorModal(null);
                      setCollaborators([]);
                      setVendorEmail('');
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Current Collaborators Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-gray-600" />
                    Current Vendors ({collaborators.length})
                  </h3>
                  
                  {loadingCollaborators ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading collaborators...
                    </div>
                  ) : collaborators.length > 0 ? (
                    <div className="space-y-2">
                      {collaborators.map((collaborator) => (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                              {collaborator.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {collaborator.name}
                              </p>
                              <p className="text-xs text-gray-500">{collaborator.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.email)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">No vendors assigned yet</p>
                      <p className="text-gray-500 text-xs">Invite a vendor below to get started</p>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Invite New Vendor Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Invite New Vendor
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Invite a vendor to view this event's layout. They will have read-only access to the floor plan.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        placeholder="vendor@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> Vendors can only view layouts, not edit them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => {
                    setInviteVendorModal(null);
                    setCollaborators([]);
                    setVendorEmail('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleInviteVendor}
                  disabled={!vendorEmail.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
  );
};

export default EventListForLayout;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Utensils,
  Armchair
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { GuestService, Guest } from '../../services/GuestService';
import ImportGuestsModal from '../../components/modals/ImportGuestsModal';

const GuestManagement: React.FC = () => {
  const { events } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    dietaryNeeds: '',
    accessibility: '',
    seat: ''
  });

  const guestService = new GuestService();

  // Restore selected event from localStorage or use first event
  useEffect(() => {
    console.log('Events:', events);
    const storedEventId = localStorage.getItem('selectedEventId');
    if (storedEventId && events.some(e => e.id === storedEventId)) {
      setSelectedEventId(storedEventId);
    } else if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
      localStorage.setItem('selectedEventId', events[0].id);
    }
  }, [events]);

  // Load guests when event is selected
  useEffect(() => {
    console.log('Selected Event ID:', selectedEventId);
    if (selectedEventId) {
      localStorage.setItem('selectedEventId', selectedEventId);
      loadGuests();
    }
  }, [selectedEventId]);

  const loadGuests = async () => {
    if (!selectedEventId) return;
    
    console.log('Loading guests for event:', selectedEventId);
    setLoading(true);
    try {
      const guestsData = await guestService.getGuestsByEvent(selectedEventId);
      console.log('Loaded guests:', guestsData);
      setGuests(guestsData);
    } catch (error) {
      console.error('Error loading guests:', error);
      // Fallback to empty array
      setGuests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!selectedEventId) return;
    
    // Validate required fields
    if (!newGuest.name || !newGuest.email || !newGuest.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }

    try {
      console.log('→ Adding guest:', newGuest);
      
      await guestService.addGuest(selectedEventId, {
        ...newGuest,
        eventId: selectedEventId
      });
      
      console.log('✓ Guest added successfully');
      
      // Reset form
      setNewGuest({
        name: '',
        email: '',
        phone: '',
        dietaryNeeds: '',
        accessibility: '',
        seat: ''
      });
      
      // Close modal
      setShowAddModal(false);
      
      // Reload guests
      await loadGuests();
      
      // Show success message
      alert('Guest added successfully!');
    } catch (error) {
      console.error('✗ Error adding guest:', error);
      alert('Failed to add guest. Please try again.');
    }
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setShowEditModal(true);
  };

  const handleUpdateGuest = async () => {
    if (!selectedEventId || !editingGuest) return;
    
    try {
      await guestService.updateGuest(selectedEventId, editingGuest.id, editingGuest);
      setShowEditModal(false);
      setEditingGuest(null);
      await loadGuests();
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('Failed to update guest. Please try again.');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!selectedEventId) return;
    
    if (confirm('Are you sure you want to delete this guest?')) {
      try {
        await guestService.deleteGuest(selectedEventId, guestId);
        await loadGuests();
      } catch (error) {
        console.error('Error deleting guest:', error);
        alert('Failed to delete guest. Please try again.');
      }
    }
  };

  const handleExportGuests = () => {
    if (guests.length === 0) {
      alert('No guests to export');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Dietary Needs', 'Accessibility', 'Seat'];
    const csvContent = [
      headers.join(','),
      ...guests.map(guest => [
        `"${guest.name}"`,
        `"${guest.email}"`,
        `"${guest.phone || ''}"`,
        `"${guest.dietaryNeeds || ''}"`,
        `"${guest.accessibility || ''}"`,
        `"${guest.seat || ''}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `guests_${selectedEventId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: guests.length,
    specialNeeds: guests.filter(g => 
      (g.dietaryNeeds && g.dietaryNeeds.toLowerCase() !== 'none' && g.dietaryNeeds.trim() !== '') ||
      (g.accessibility && g.accessibility.toLowerCase() !== 'none' && g.accessibility.trim() !== '')
    ).length,
    assignedSeats: guests.filter(g => g.seat).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
              <p className="text-gray-600 mt-2">Manage your event guests and RSVPs</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Event Selector */}
              {events && events.length > 0 && (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select Event</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                disabled={!selectedEventId}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Guest
              </button>
              <button
                onClick={loadGuests}
                disabled={!selectedEventId}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ marginLeft: '8px' }}
              >
                <span className="mr-2">🔄</span>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Show message if no event selected */}
        {!selectedEventId ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Selected</h3>
            <p className="text-gray-500">
              {events && events.length > 0 
                ? 'Please select an event from the dropdown above to manage guests'
                : 'No events available. Please create an event first.'}
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Guests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Special Needs</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.specialNeeds}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Utensils className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned Seats</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.assignedSeats}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Armchair className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search guests by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowImportModal(true)}
                disabled={!selectedEventId}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <button 
                onClick={handleExportGuests}
                disabled={guests.length === 0}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading guests...</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding your first guest'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add First Guest
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Special Needs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.map((guest, index) => (
                  <motion.tr
                    key={guest.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {guest.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {guest.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {guest.dietaryNeeds && guest.dietaryNeeds.toLowerCase() !== 'none' && (
                          <div className="mb-1">🍽️ {guest.dietaryNeeds}</div>
                        )}
                        {guest.accessibility && guest.accessibility.toLowerCase() !== 'none' && (
                          <div>♿ {guest.accessibility}</div>
                        )}
                        {(!guest.dietaryNeeds || guest.dietaryNeeds.toLowerCase() === 'none') && 
                         (!guest.accessibility || guest.accessibility.toLowerCase() === 'none') && (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.seat ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                          {guest.seat}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditGuest(guest)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit guest"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete guest"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600" title="More options">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Add Guest Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <UserPlus className="h-6 w-6 mr-2 text-primary-600" />
                      Add New Guest
                    </h2>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newGuest.name}
                        onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={newGuest.phone}
                        onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="+1 234 567 8900"
                        required
                      />
                    </div>

                    {/* Dietary Needs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dietary Needs
                      </label>
                      <input
                        type="text"
                        value={newGuest.dietaryNeeds}
                        onChange={(e) => setNewGuest({ ...newGuest, dietaryNeeds: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Vegetarian, Gluten-free, etc."
                      />
                    </div>

                    {/* Accessibility */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accessibility Requirements
                      </label>
                      <input
                        type="text"
                        value={newGuest.accessibility}
                        onChange={(e) => setNewGuest({ ...newGuest, accessibility: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Wheelchair access, etc."
                      />
                    </div>

                    {/* Table Assignment */}
                    {/* Table Assignment input removed as requested */}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddGuest}
                      disabled={!newGuest.name || !newGuest.email || !newGuest.phone}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Guest
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Guest Modal */}
        <AnimatePresence>
          {showEditModal && editingGuest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Edit className="h-6 w-6 mr-2 text-primary-600" />
                      Edit Guest
                    </h2>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingGuest(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editingGuest.name}
                        onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={editingGuest.email}
                          onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={editingGuest.phone}
                          onChange={(e) => setEditingGuest({ ...editingGuest, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>

                    {/* Dietary Needs & Accessibility */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dietary Needs
                        </label>
                        <input
                          type="text"
                          value={editingGuest.dietaryNeeds || ''}
                          onChange={(e) => setEditingGuest({ ...editingGuest, dietaryNeeds: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Vegetarian, Gluten-free, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Accessibility Needs
                        </label>
                        <input
                          type="text"
                          value={editingGuest.accessibility || ''}
                          onChange={(e) => setEditingGuest({ ...editingGuest, accessibility: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Wheelchair access, etc."
                        />
                      </div>
                    </div>

                    {/* Seat Assignment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seat Assignment
                      </label>
                      <input
                        type="text"
                        value={editingGuest.seat || ''}
                        onChange={(e) => setEditingGuest({ ...editingGuest, seat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Seat number or name"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingGuest(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateGuest}
                      disabled={!editingGuest.name || !editingGuest.email || !editingGuest.phone}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Guest
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Import Guests Modal */}
        <ImportGuestsModal 
          isOpen={showImportModal} 
          onClose={() => {
            setShowImportModal(false);
            loadGuests(); // Reload guests after import
          }} 
        />
          </>
        )}
      </div>
    </div>
  );
};

export default GuestManagement;

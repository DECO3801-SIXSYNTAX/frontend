import React, { useState, useEffect } from 'react';
import { X, Search, Mail, Users, CheckCircle } from 'lucide-react';
import { DashboardService } from '../../services/DashboardService';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
}

interface SelectGuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvites: (guestIds: string[]) => void;
  eventId: string;
}

const SelectGuestsModal: React.FC<SelectGuestsModalProps> = ({
  isOpen,
  onClose,
  onSendInvites,
  eventId
}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dashboardService = new DashboardService();

  useEffect(() => {
    if (isOpen) {
      loadGuests();
    }
  }, [isOpen, eventId]);

  const loadGuests = async () => {
    setIsLoading(true);
    try {
      const guestsData = await dashboardService.getGuests(eventId);
      setGuests(guestsData);
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuestIds.length === filteredGuests.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(filteredGuests.map(g => g.id));
    }
  };

  const handleSend = () => {
    if (selectedGuestIds.length > 0) {
      onSendInvites(selectedGuestIds);
      setSelectedGuestIds([]);
      setSearchTerm('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Invitations</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select guests to receive email invitations with QR codes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Select All */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search guests by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {selectedGuestIds.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-600">
              {selectedGuestIds.length} of {filteredGuests.length} selected
            </span>
          </div>
        </div>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading guests...</span>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">
                {searchTerm ? 'No guests found matching your search' : 'No guests added yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() => toggleGuestSelection(guest.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedGuestIds.includes(guest.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{guest.name}</h3>
                        {selectedGuestIds.includes(guest.id) && (
                          <CheckCircle className="h-5 w-5 text-indigo-600 ml-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{guest.email}</p>
                      {guest.phone && (
                        <p className="text-xs text-gray-500 mt-1">{guest.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedGuestIds.length > 0 ? (
                <span className="font-medium text-indigo-600">
                  {selectedGuestIds.length} guest{selectedGuestIds.length !== 1 ? 's' : ''} will receive invitation{selectedGuestIds.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>Select guests to send invitations</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={selectedGuestIds.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invitations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectGuestsModal;

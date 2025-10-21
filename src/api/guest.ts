import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DjangoGuest {
  id?: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  dietaryRestriction?: string;
  accessibilityNeeds?: string;
  seat?: string;  // Read-only, assigned from Layout Editor
  tags?: string[];  // Read-only
}

// Get token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// List guests for an event
export async function apiListGuests(eventId: string, params?: {
  q?: string;
  tags?: string[];
  limit?: number;
  pageToken?: string;
}): Promise<{ items: DjangoGuest[]; nextPageToken?: string }> {
  const response = await axios.get(`${API_URL}/api/guest/${eventId}/`, {
    headers: getAuthHeaders(),
    params
  });
  return response.data;
}

// Create a guest
export async function apiCreateGuest(eventId: string, guest: Omit<DjangoGuest, 'id' | 'seat' | 'tags'>): Promise<{ id: string }> {
  const response = await axios.post(`${API_URL}/api/guest/${eventId}/`, guest, {
    headers: getAuthHeaders()
  });
  return response.data;
}

// Update a guest
export async function apiUpdateGuest(eventId: string, guestId: string, updates: Partial<DjangoGuest>): Promise<{ id: string }> {
  const response = await axios.patch(`${API_URL}/api/guest/${eventId}/${guestId}/`, updates, {
    headers: getAuthHeaders()
  });
  return response.data;
}

// Delete a guest
export async function apiDeleteGuest(eventId: string, guestId: string): Promise<void> {
  await axios.delete(`${API_URL}/api/guest/${eventId}/${guestId}/`, {
    headers: getAuthHeaders()
  });
}

// Import guests from CSV
export async function apiImportGuestsCSV(eventId: string, file: File): Promise<{ imported: number; skipped: any[] }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_URL}/api/guest/import-csv/${eventId}/`, formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      // Don't set Content-Type, let browser set it with boundary
    }
  });
  return response.data;
}

// Get guest QR code
export async function apiGetGuestQR(eventId: string, guestId: string): Promise<Blob> {
  const response = await axios.get(`${API_URL}/api/guest/qr/${eventId}/${guestId}/`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    responseType: 'blob'
  });
  return response.data;
}

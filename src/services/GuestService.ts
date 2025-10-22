// src/services/GuestService.ts
import axios from 'axios';

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'declined';
  rsvpDate?: string;
  dietaryNeeds?: string;
  accessibility?: string;
  plusOne: boolean;
  plusOneName?: string;
  table?: string;
  seat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class GuestService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  private getAuthToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required. Please sign in.');
    }
    return token;
  }

  // Get all guests for an event
  async getGuestsByEvent(eventId: string): Promise<Guest[]> {
    try {
      const token = this.getAuthToken();
      
      const response = await axios.get(
        `${this.apiUrl}/api/guests/${eventId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Django returns {items: [...], nextPageToken: "..."} format
      const items = response.data?.items || response.data;
      const guests = Array.isArray(items) ? items : [];

      console.log('✓ Fetched guests from Django:', {
        eventId,
        count: guests.length
      });

      return guests;
    } catch (error: any) {
      console.error('Error fetching guests:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to fetch guests');
      }
    }
  }

  // Get a single guest
  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    try {
      const token = this.getAuthToken();
      
      const response = await axios.get(
        `${this.apiUrl}/api/guests/${eventId}/${guestId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error fetching guest:', error);
      
      if (error.response?.status === 404) {
        return null;
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to fetch guest');
      }
    }
  }

  // Add a new guest
  async addGuest(eventId: string, guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    try {
      const token = this.getAuthToken();
      
      const response = await axios.post(
        `${this.apiUrl}/api/guests/${eventId}/`,
        guestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Created guest via Django:', {
        eventId,
        guestId: response.data.id
      });

      return response.data;
    } catch (error: any) {
      console.error('Error adding guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to add guest');
      }
    }
  }

  // Update a guest
  async updateGuest(eventId: string, guestId: string, guestData: Partial<Guest>): Promise<Guest> {
    try {
      const token = this.getAuthToken();
      
      const response = await axios.patch(
        `${this.apiUrl}/api/guests/${eventId}/${guestId}/`,
        guestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Updated guest via Django:', {
        eventId,
        guestId,
        updatedFields: Object.keys(guestData)
      });

      return response.data;
    } catch (error: any) {
      console.error('Error updating guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to update guest');
      }
    }
  }

  // Delete a guest
  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      
      await axios.delete(
        `${this.apiUrl}/api/guests/${eventId}/${guestId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Deleted guest via Django:', {
        eventId,
        guestId
      });
    } catch (error: any) {
      console.error('Error deleting guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to delete guest');
      }
    }
  }

  // Bulk import guests via CSV
  async importGuestsCSV(eventId: string, csvFile: File): Promise<any> {
    try {
      const token = this.getAuthToken();
      
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await axios.post(
        `${this.apiUrl}/api/guests/import-csv/${eventId}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );

      console.log('✓ Imported guests from CSV via Django:', {
        eventId,
        fileName: csvFile.name,
        result: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error('Error importing guests:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to import guests');
      }
    }
  }

  // Update guest RSVP status
  async updateRSVPStatus(eventId: string, guestId: string, status: 'confirmed' | 'pending' | 'declined'): Promise<void> {
    await this.updateGuest(eventId, guestId, {
      status,
      rsvpDate: new Date().toISOString()
    });
  }

  // Assign table to guest
  async assignTable(eventId: string, guestId: string, table: string): Promise<void> {
    // Backend expects 'seat' field, not 'table'
    await this.updateGuest(eventId, guestId, { seat: table });
  }

  // Get guest statistics
  async getGuestStats(eventId: string): Promise<{
    total: number;
    confirmed: number;
    pending: number;
    declined: number;
    withPlusOne: number;
  }> {
    try {
      const guests = await this.getGuestsByEvent(eventId);
      
      return {
        total: guests.length,
        confirmed: guests.filter(g => g.status === 'confirmed').length,
        pending: guests.filter(g => g.status === 'pending').length,
        declined: guests.filter(g => g.status === 'declined').length,
        withPlusOne: guests.filter(g => g.plusOne).length
      };
    } catch (error) {
      console.error('Error fetching guest stats:', error);
      throw new Error('Failed to fetch guest statistics');
    }
  }

  // Send invite to a single guest
  async sendInvite(eventId: string, guestId: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      
      await axios.post(
        `${this.apiUrl}/api/guests/${eventId}/${guestId}/send-invite/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Sent invite via Django:', {
        eventId,
        guestId
      });
    } catch (error: any) {
      console.error('Error sending invite:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to send invite');
      }
    }
  }

  // Bulk send invites
  async bulkSendInvites(eventId: string, guestIds: string[]): Promise<void> {
    try {
      const token = this.getAuthToken();
      
      await axios.post(
        `${this.apiUrl}/api/guests/bulk-send-invites/${eventId}/`,
        { guest_ids: guestIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Sent bulk invites via Django:', {
        eventId,
        count: guestIds.length
      });
    } catch (error: any) {
      console.error('Error sending bulk invites:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to send invites');
      }
    }
  }

  // Get guest QR code
  async getGuestQR(eventId: string, guestId: string): Promise<Blob> {
    try {
      const token = this.getAuthToken();
      
      const response = await axios.get(
        `${this.apiUrl}/api/guests/qr/${eventId}/${guestId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      console.log('✓ Got QR code via Django:', {
        eventId,
        guestId
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to get QR code');
      }
    }
  }
}

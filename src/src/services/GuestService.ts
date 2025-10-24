// src/services/GuestService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

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
  constructor() {
    // No need for API URL anymore - using Firestore directly
  }

  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      // Fallback to localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          return userData.id;
        } catch (e) {
          throw new Error('No user is currently signed in');
        }
      }
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  // Get all guests for an event
  async getGuestsByEvent(eventId: string): Promise<Guest[]> {
    try {
      console.log('→ Fetching guests from Firestore for event:', eventId);

      const guestsRef = collection(db, 'events', eventId, 'guests');
      const snapshot = await getDocs(guestsRef);
      
      const guests = snapshot.docs.map(doc => ({
        id: doc.id,
        eventId: eventId,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      })) as Guest[];

      console.log('✓ Fetched guests from Firestore:', {
        eventId,
        count: guests.length
      });

      return guests;
    } catch (error: any) {
      console.error('✗ Error fetching guests:', error);
      throw new Error('Failed to fetch guests');
    }
  }

  // Get a single guest
  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    try {
      console.log('→ Fetching guest from Firestore:', guestId);

      const guestRef = doc(db, 'events', eventId, 'guests', guestId);
      const guestDoc = await getDoc(guestRef);

      if (!guestDoc.exists()) {
        return null;
      }

      const guest = {
        id: guestId,
        eventId: eventId,
        ...guestDoc.data(),
        createdAt: guestDoc.data().createdAt?.toDate?.()?.toISOString() || guestDoc.data().createdAt,
        updatedAt: guestDoc.data().updatedAt?.toDate?.()?.toISOString() || guestDoc.data().updatedAt,
      } as Guest;

      console.log('✓ Fetched guest from Firestore:', guestId);
      return guest;
    } catch (error: any) {
      console.error('✗ Error fetching guest:', error);
      throw new Error('Failed to fetch guest');
    }
  }

  // Add a new guest
  async addGuest(eventId: string, guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    try {
      console.log('→ Adding guest to Firestore');

      const guestsRef = collection(db, 'events', eventId, 'guests');
      const newGuest = {
        ...guestData,
        eventId: eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(guestsRef, newGuest);

      const createdGuest = {
        id: docRef.id,
        ...guestData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Guest;

      console.log('✓ Guest added to Firestore:', docRef.id);
      return createdGuest;
    } catch (error: any) {
      console.error('✗ Error adding guest:', error);
      throw new Error('Failed to add guest');
    }
  }

  // Update a guest
  async updateGuest(eventId: string, guestId: string, guestData: Partial<Guest>): Promise<Guest> {
    try {
      console.log('→ Updating guest in Firestore');

      const guestRef = doc(db, 'events', eventId, 'guests', guestId);
      
      const updatedData: Record<string, any> = {
        ...guestData,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updatedData).forEach((key: string) => {
        if (updatedData[key] === undefined) {
          delete updatedData[key];
        }
      });

      await updateDoc(guestRef, updatedData);

      // Get updated guest
      const guestDoc = await getDoc(guestRef);
      const updatedGuest = {
        id: guestId,
        eventId: eventId,
        ...guestDoc.data(),
      } as Guest;

      console.log('✓ Guest updated in Firestore:', guestId);
      return updatedGuest;
    } catch (error: any) {
      console.error('✗ Error updating guest:', error);
      throw new Error('Failed to update guest');
    }
  }

  // Delete a guest
  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    try {
      console.log('→ Deleting guest from Firestore');

      const guestRef = doc(db, 'events', eventId, 'guests', guestId);
      await deleteDoc(guestRef);

      console.log('✓ Guest deleted from Firestore:', guestId);
    } catch (error: any) {
      console.error('✗ Error deleting guest:', error);
      throw new Error('Failed to delete guest');
    }
  }

  // Bulk import guests via CSV (untuk compatibility)
  async importGuestsCSV(eventId: string, csvFile: File): Promise<any> {
    try {
      console.log('→ Importing guests from CSV to Firestore');
      
      // Parse CSV file (you'll need to implement CSV parsing)
      // For now, throwing error to inform user
      throw new Error('CSV import via Firestore not yet implemented. Please use individual guest add.');
      
    } catch (error: any) {
      console.error('✗ Error importing guests:', error);
      throw new Error('Failed to import guests');
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
    await this.updateGuest(eventId, guestId, { table: table, seat: table });
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
      console.error('✗ Error fetching guest stats:', error);
      throw new Error('Failed to fetch guest statistics');
    }
  }

  // Send invite to a single guest (placeholder - need email service)
  async sendInvite(eventId: string, guestId: string): Promise<void> {
    try {
      console.log('→ Sending invite (placeholder)');
      // TODO: Implement email service integration
      console.warn('Email service not yet implemented');
      throw new Error('Email invite feature not yet available');
    } catch (error: any) {
      console.error('✗ Error sending invite:', error);
      throw new Error('Failed to send invite');
    }
  }

  // Bulk send invites (placeholder)
  async bulkSendInvites(eventId: string, guestIds: string[]): Promise<void> {
    try {
      console.log('→ Sending bulk invites (placeholder)');
      // TODO: Implement bulk email service
      console.warn('Bulk email service not yet implemented');
      throw new Error('Bulk invite feature not yet available');
    } catch (error: any) {
      console.error('✗ Error sending bulk invites:', error);
      throw new Error('Failed to send invites');
    }
  }

  // Get guest QR code (placeholder)
  async getGuestQR(eventId: string, guestId: string): Promise<Blob> {
    try {
      console.log('→ Getting QR code (placeholder)');
      // TODO: Implement QR code generation
      throw new Error('QR code generation not yet available');
    } catch (error: any) {
      console.error('✗ Error getting QR code:', error);
      throw new Error('Failed to get QR code');
    }
  }
}
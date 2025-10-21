// src/services/GuestService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp
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
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class GuestService {
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  // Get all guests for an event
  async getGuestsByEvent(eventId: string): Promise<Guest[]> {
    try {
      const userId = this.getCurrentUserId();
      const guestsRef = collection(db, 'users', userId, 'events', eventId, 'guests');
      const snapshot = await getDocs(guestsRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Guest));
    } catch (error) {
      console.error('Error fetching guests:', error);
      throw new Error('Failed to fetch guests');
    }
  }

  // Get a single guest
  async getGuest(eventId: string, guestId: string): Promise<Guest | null> {
    try {
      const userId = this.getCurrentUserId();
      const guestRef = doc(db, 'users', userId, 'events', eventId, 'guests', guestId);
      const guestDoc = await getDoc(guestRef);

      if (guestDoc.exists()) {
        return {
          id: guestDoc.id,
          ...guestDoc.data()
        } as Guest;
      }

      return null;
    } catch (error) {
      console.error('Error fetching guest:', error);
      throw new Error('Failed to fetch guest');
    }
  }

  // Add a new guest
  async addGuest(eventId: string, guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      const guestsRef = collection(db, 'users', userId, 'events', eventId, 'guests');

      const newGuest = {
        ...guestData,
        eventId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(guestsRef, newGuest);
      return docRef.id;
    } catch (error) {
      console.error('Error adding guest:', error);
      throw new Error('Failed to add guest');
    }
  }

  // Update a guest
  async updateGuest(eventId: string, guestId: string, guestData: Partial<Guest>): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const guestRef = doc(db, 'users', userId, 'events', eventId, 'guests', guestId);

      await updateDoc(guestRef, {
        ...guestData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating guest:', error);
      throw new Error('Failed to update guest');
    }
  }

  // Delete a guest
  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const guestRef = doc(db, 'users', userId, 'events', eventId, 'guests', guestId);
      await deleteDoc(guestRef);
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw new Error('Failed to delete guest');
    }
  }

  // Bulk import guests
  async importGuests(eventId: string, guests: Omit<Guest, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const guestsRef = collection(db, 'users', userId, 'events', eventId, 'guests');

      const promises = guests.map(guest => 
        addDoc(guestsRef, {
          ...guest,
          eventId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error importing guests:', error);
      throw new Error('Failed to import guests');
    }
  }

  // Update guest RSVP status
  async updateRSVPStatus(eventId: string, guestId: string, status: 'confirmed' | 'pending' | 'declined'): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const guestRef = doc(db, 'users', userId, 'events', eventId, 'guests', guestId);

      await updateDoc(guestRef, {
        status,
        rsvpDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating RSVP status:', error);
      throw new Error('Failed to update RSVP status');
    }
  }

  // Assign table to guest
  async assignTable(eventId: string, guestId: string, table: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const guestRef = doc(db, 'users', userId, 'events', eventId, 'guests', guestId);

      await updateDoc(guestRef, {
        table,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning table:', error);
      throw new Error('Failed to assign table');
    }
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
}

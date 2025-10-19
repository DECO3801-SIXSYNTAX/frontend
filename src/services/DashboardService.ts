// src/services/DashboardService.ts
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
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Event, Guest, TeamMember, Activity, Invitation, CreateEventForm } from '../types/dashboard';

export class DashboardService {
  // Helper to get current user ID
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  // Users
  async getUsers(): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Events
  async getEvents(): Promise<Event[]> {
    try {
      const userId = this.getCurrentUserId();
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('createdBy', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          startDate: data.startDate,
          endDate: data.endDate,
        } as Event;
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  async getEvent(eventId: string): Promise<Event> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const data = eventDoc.data();
      return {
        id: eventDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        startDate: data.startDate,
        endDate: data.endDate,
      } as Event;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }
  }

  async createEvent(eventData: CreateEventForm, userId?: string): Promise<Event> {
    try {
      const currentUserId = userId || this.getCurrentUserId();

      const newEvent = {
        ...eventData,
        actualAttendees: 0,
        status: 'draft',
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, newEvent);

      // Log activity
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Created event',
        details: eventData.name,
        eventId: docRef.id,
        type: 'event'
      });

      // Return the created event
      return {
        id: docRef.id,
        ...newEvent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  async updateEvent(eventId: string, updates: Partial<Event>, userId?: string): Promise<Event> {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      const eventRef = doc(db, 'events', eventId);

      const updatedData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined values
      Object.keys(updatedData).forEach(key =>
        updatedData[key] === undefined && delete updatedData[key]
      );

      await updateDoc(eventRef, updatedData);

      // Log activity
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Updated event',
        details: `${updates.name || 'Event'} - Updated`,
        eventId,
        type: 'event'
      });

      // Get and return the updated event
      return await this.getEvent(eventId);
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  async deleteEvent(eventId: string, userId?: string): Promise<void> {
    try {
      const currentUserId = userId || this.getCurrentUserId();

      // Get event details for logging
      const event = await this.getEvent(eventId);

      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);

      // Also delete associated guests
      const guestsRef = collection(db, 'guests');
      const guestsQuery = query(guestsRef, where('eventId', '==', eventId));
      const guestsSnapshot = await getDocs(guestsQuery);

      const deletePromises = guestsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Log activity
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Deleted event',
        details: event.name,
        eventId: null,
        type: 'event'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  // Guests
  async getGuests(eventId?: string): Promise<Guest[]> {
    try {
      const guestsRef = collection(db, 'guests');
      let q;

      if (eventId) {
        q = query(guestsRef, where('eventId', '==', eventId));
      } else {
        const userId = this.getCurrentUserId();
        q = query(guestsRef, where('createdBy', '==', userId));
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          importedAt: data.importedAt?.toDate?.()?.toISOString() || data.importedAt,
        } as Guest;
      });
    } catch (error) {
      console.error('Error fetching guests:', error);
      throw new Error('Failed to fetch guests');
    }
  }

  async importGuests(guests: Omit<Guest, 'id' | 'importedAt'>[], userId?: string): Promise<Guest[]> {
    try {
      const currentUserId = userId || this.getCurrentUserId();

      // Get event ID from the first guest (all guests should be for the same event)
      const eventId = guests[0]?.eventId;
      if (!eventId) {
        throw new Error('Event ID is required for importing guests');
      }

      // Get authentication token
      console.log('DEBUG: Current auth user:', auth.currentUser);
      console.log('DEBUG: User email:', auth.currentUser?.email);
      console.log('DEBUG: User ID:', auth.currentUser?.uid);

      const token = await auth.currentUser?.getIdToken();
      console.log('DEBUG: Token retrieved:', token ? 'YES (length: ' + token.length + ')' : 'NO');
      console.log('DEBUG: Token preview:', token ? token.substring(0, 50) + '...' : 'null');

      if (!token) {
        console.error('DEBUG: Authentication token is missing!');
        throw new Error('Authentication token not found');
      }


      // Prepare guest data for backend API
      const guestsData = guests.map(guest => ({
        name: guest.name,
        email: guest.email,
        phone: guest.phone || '',
        dietary_restrictions: guest.dietaryRestrictions || 'none',
        accessibility_needs: guest.accessibilityNeeds || 'none',
        rsvp_status: guest.rsvpStatus || 'pending'
      }));

      // Call backend API
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/guest/${eventId}/import-csv/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ guests: guestsData })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to import guests' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Log activity
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Imported guests',
        details: `Added ${guests.length} guests`,
        eventId: eventId,
        type: 'guest'
      });

      // Return the imported guests from backend response
      return result.guests || result.data || [];
    } catch (error: any) {
      console.error('Error importing guests:', error);
      throw new Error(error.message || 'Failed to import guests');
    }
  }

  async updateGuest(guestId: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await updateDoc(guestRef, updates);

      const updatedDoc = await getDoc(guestRef);
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        importedAt: data?.importedAt?.toDate?.()?.toISOString() || data?.importedAt,
      } as Guest;
    } catch (error) {
      console.error('Error updating guest:', error);
      throw new Error('Failed to update guest');
    }
  }

  async deleteGuest(guestId: string): Promise<void> {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await deleteDoc(guestRef);
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw new Error('Failed to delete guest');
    }
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const userId = this.getCurrentUserId();
      const teamRef = collection(db, 'teamMembers');
      const q = query(teamRef, where('addedBy', '==', userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TeamMember));
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  async addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    try {
      const teamRef = collection(db, 'teamMembers');
      const docRef = await addDoc(teamRef, {
        ...member,
        addedBy: this.getCurrentUserId(),
        addedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...member,
      } as TeamMember;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw new Error('Failed to add team member');
    }
  }

  async createInvitation(createdBy?: string): Promise<Invitation> {
    try {
      const userId = createdBy || this.getCurrentUserId();

      const invitation = {
        code: `SIPANIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        used: false,
        usedBy: null,
        usedAt: null,
        createdAt: serverTimestamp(),
      };

      const invitationsRef = collection(db, 'invitations');
      const docRef = await addDoc(invitationsRef, invitation);

      return {
        id: docRef.id,
        ...invitation,
        createdAt: new Date().toISOString(),
      } as Invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    try {
      const userId = this.getCurrentUserId();
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        } as Activity;
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  async logActivity(activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> {
    try {
      const activitiesRef = collection(db, 'activities');
      const docRef = await addDoc(activitiesRef, {
        ...activityData,
        timestamp: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...activityData,
        timestamp: new Date().toISOString(),
      } as Activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw here as logging activities shouldn't break main functionality
      return {
        id: uuidv4(),
        ...activityData,
        timestamp: new Date().toISOString(),
      } as Activity;
    }
  }

  // Statistics
  async getEventStatistics(): Promise<{
    totalGuests: number;
    assignedSeats: number;
    dietaryNeeds: number;
    accessibilityNeeds: number;
    completionRate: number;
  }> {
    try {
      const [events, guests] = await Promise.all([
        this.getEvents(),
        this.getGuests()
      ]);

      const totalGuests = events.reduce((sum, event) => sum + event.expectedAttendees, 0);
      const assignedSeats = events.reduce((sum, event) => sum + event.actualAttendees, 0);
      const dietaryNeeds = events.reduce((sum, event) => sum + event.dietaryNeeds, 0);
      const accessibilityNeeds = events.reduce((sum, event) => sum + event.accessibilityNeeds, 0);

      const totalEvents = events.length;
      const completedEvents = events.filter(event =>
        event.status === 'done' || new Date(event.endDate) < new Date()
      ).length;
      const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

      return {
        totalGuests,
        assignedSeats,
        dietaryNeeds,
        accessibilityNeeds,
        completionRate: Math.round(completionRate)
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return {
        totalGuests: 0,
        assignedSeats: 0,
        dietaryNeeds: 0,
        accessibilityNeeds: 0,
        completionRate: 0
      };
    }
  }
}

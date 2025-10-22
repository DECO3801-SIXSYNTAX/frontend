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
import axios from 'axios';

export class DashboardService {
  // Helper to get current user from Django JWT or Firebase authentication
  private getCurrentUser(): { id: string; email?: string; role?: string } | null {
    // Try to get user from localStorage (Django JWT auth)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          return {
            id: user.id,
            email: user.email,
            role: user.role
          };
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    
    // Fallback to Firebase auth (for backward compatibility)
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        role: undefined
      };
    }
    
    return null;
  }

  // Helper to get current user ID
  private getCurrentUserId(): string {
    const user = this.getCurrentUser();
    if (!user) {
      console.error('❌ No user found in localStorage or Firebase auth');
      console.log('localStorage user:', localStorage.getItem('user'));
      console.log('localStorage access_token:', localStorage.getItem('access_token'));
      throw new Error('No user is currently signed in');
    }
    console.log('✅ Current user:', user);
    return user.id;
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
        status: 'DRAFT',
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

      // Also delete associated guests from nested path
      const guestsRef = collection(db, 'users', currentUserId, 'events', eventId, 'guests');
      const guestsSnapshot = await getDocs(guestsRef);

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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      if (eventId) {
        // Get guests for specific event from Django backend
        const response = await axios.get(
          `${apiUrl}/api/guest/${eventId}/`,
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
          count: guests.length,
          responseFormat: response.data?.items ? 'paginated {items, nextPageToken}' : 'direct array',
          hasNextPage: !!response.data?.nextPageToken
        });

        return guests;
      } else {
        // Get all guests across all events
        const events = await this.getEvents();
        const allGuests: Guest[] = [];

        for (const event of events) {
          try {
            const response = await axios.get(
              `${apiUrl}/api/guest/${event.id}/`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Django returns {items: [...], nextPageToken: "..."} format
            const items = response.data?.items || response.data;
            const eventGuests = Array.isArray(items) ? items : [];
            if (eventGuests.length > 0) {
              allGuests.push(...eventGuests);
            }
          } catch (error) {
            console.error(`Error fetching guests for event ${event.id}:`, error);
            // Continue with other events even if one fails
          }
        }

        console.log('✓ Fetched all guests from Django:', {
          totalEvents: events.length,
          totalGuests: allGuests.length
        });

        return allGuests;
      }
    } catch (error: any) {
      console.error('✗ Error fetching guests:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to fetch guests');
      }
    }
  }

  async importGuestsFromCSV(csvFile: File, eventId: string): Promise<Guest[]> {
    try {
      const currentUserId = this.getCurrentUserId();

      if (!eventId) {
        throw new Error('Event ID is required for importing guests');
      }

      // Get Django JWT token from localStorage (set during Google sign-in)
      const djangoToken = localStorage.getItem('access_token');
      console.log('DEBUG: Django JWT token:', djangoToken ? 'YES (length: ' + djangoToken.length + ')' : 'NO');

      if (!djangoToken) {
        throw new Error('Authentication required. Please sign in with Google to import guests.');
      }

      console.log('DEBUG: Using Django JWT token (length: ' + djangoToken.length + ')');
      console.log('DEBUG: Token preview:', djangoToken.substring(0, 50) + '...');

      // Create FormData to send CSV file
      const formData = new FormData();
      formData.append('file', csvFile); // Backend expects 'file' field name

      // Call backend API using axios with FormData
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      console.log('Sending import CSV file to Django backend:', {
        url: `${apiUrl}/api/guest/import-csv/${eventId}/`,
        fileName: csvFile.name,
        fileSize: csvFile.size,
        fileType: csvFile.type,
        eventId: eventId
      });

      const response = await axios.post(
        `${apiUrl}/api/guest/import-csv/${eventId}/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${djangoToken}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✓ Django backend import CSV successful:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        responseData: response.data
      });

      // Log activity
      const importedCount = response.data.imported || 0;
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Imported guests',
        details: `Imported ${importedCount} guests from ${csvFile.name}`,
        eventId: eventId,
        type: 'guest'
      });

      // Return the backend response (contains imported and skipped counts)
      return response.data;
    } catch (error: any) {
      console.error('✗ Django backend import CSV error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url: error.config?.url
      });

      // Provide better error messages
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden. You don\'t have permission to import guests.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to import guests');
      }
    }
  }

  // Keep the old method for backward compatibility but mark as deprecated
  async importGuests(guests: Omit<Guest, 'id' | 'importedAt'>[], userId?: string): Promise<Guest[]> {
    console.warn('importGuests is deprecated. Use importGuestsFromCSV instead.');
    // Fallback to Firebase for now
    try {
      const currentUserId = userId || this.getCurrentUserId();
      const guestsRef = collection(db, 'guests');

      const newGuests = guests.map(guest => ({
        ...guest,
        createdBy: currentUserId,
        importedAt: serverTimestamp(),
      }));

      const promises = newGuests.map(guest => addDoc(guestsRef, guest));
      const results = await Promise.all(promises);

      // Log activity
      await this.logActivity({
        userId: currentUserId,
        userName: auth.currentUser?.displayName || 'Current User',
        action: 'Imported guests',
        details: `Added ${newGuests.length} guests`,
        eventId: newGuests[0]?.eventId || null,
        type: 'guest'
      });

      // Return created guests with IDs
      return results.map((docRef, index) => ({
        id: docRef.id,
        ...newGuests[index],
        importedAt: new Date().toISOString(),
      } as Guest));
    } catch (error) {
      console.error('Error importing guests:', error);
      throw new Error('Failed to import guests');
    }
  }

  async updateGuest(eventId: string, guestId: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      const response = await axios.patch(
        `${apiUrl}/api/guest/${eventId}/${guestId}/`,
        updates,
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
        updatedFields: Object.keys(updates)
      });

      return response.data;
    } catch (error: any) {
      console.error('✗ Error updating guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to update guest');
      }
    }
  }

  async deleteGuest(eventId: string, guestId: string): Promise<void> {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      await axios.delete(
        `${apiUrl}/api/guest/${eventId}/${guestId}/`,
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
      console.error('✗ Error deleting guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to delete guest');
      }
    }
  }

  async addGuest(eventId: string, guestData: Partial<Guest>): Promise<Guest> {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      const response = await axios.post(
        `${apiUrl}/api/guest/${eventId}/`,
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
      console.error('✗ Error creating guest:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error(error.message || 'Failed to create guest');
      }
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
      const userId = this.getCurrentUserId();
      
      // Get all events for this user
      const events = await this.getEvents();
      
      // Get all guests across all events for this user
      const allGuests: Guest[] = [];
      for (const event of events) {
        try {
          const eventGuests = await this.getGuests(event.id);
          
          // Ensure eventGuests is an array before spreading
          if (Array.isArray(eventGuests)) {
            allGuests.push(...eventGuests);
          } else {
            console.warn(`getGuests returned non-array for event ${event.id}:`, eventGuests);
          }
        } catch (error) {
          console.error(`Error fetching guests for event ${event.id}:`, error);
          // Continue with other events
        }
      }

      console.log(`Total guests collected: ${allGuests.length}`);

      // Debug: Log a sample guest to see field names
      if (allGuests.length > 0) {
        console.log('Sample guest data:', allGuests[0]);
      }

      // Calculate statistics from actual guest data
      const totalGuests = allGuests.length;
      
      // Count guests with assigned tables (table field is not empty/null)
      const assignedSeats = allGuests.filter(guest => {
        const guestAny = guest as any;
        return guestAny.table && guestAny.table.trim() !== '';
      }).length;
      
      // Count guests with dietary needs
      const dietaryNeeds = allGuests.filter(guest => {
        const guestAny = guest as any;
        // Check both possible field names: dietaryRestrictions (frontend) and dietaryRestriction (backend)
        const dietary = guestAny.dietaryRestrictions || guestAny.dietaryRestriction || '';
        return dietary && dietary.trim() !== '' && dietary.toLowerCase() !== 'none';
      }).length;

      // Count guests with accessibility needs
      const accessibilityNeeds = allGuests.filter(guest => {
        const guestAny = guest as any;
        // Check both possible field names: accessibilityNeeds (both frontend and backend)
        const accessibility = guestAny.accessibilityNeeds || '';
        return accessibility && accessibility.trim() !== '' && accessibility.toLowerCase() !== 'none';
      }).length;

      console.log('Statistics calculated:', {
        totalGuests,
        assignedSeats,
        dietaryNeeds,
        accessibilityNeeds,
        sampleDietary: allGuests.length > 0 ? (allGuests[0] as any).dietaryRestrictions || (allGuests[0] as any).dietaryRestriction : 'N/A',
        sampleAccessibility: allGuests.length > 0 ? (allGuests[0] as any).accessibilityNeeds : 'N/A'
      });

      // Calculate completion rate based on events
      const totalEvents = events.length;
      const completedEvents = events.filter(event =>
        event.status === 'PUBLISHED'
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

  // Get statistics for individual events
  async getEventStatisticsBreakdown(): Promise<Array<{
    eventId: string;
    eventName: string;
    totalGuests: number;
    assignedSeats: number;
    dietaryNeeds: number;
    accessibilityNeeds: number;
    startDate: string;
    status: string;
  }>> {
    try {
      const events = await this.getEvents();
      
      const breakdown = await Promise.all(
        events.map(async (event) => {
          const guests = await this.getGuests(event.id);
          
          const totalGuests = guests.length;
          const assignedSeats = guests.filter(guest => {
            const guestAny = guest as any;
            return guestAny.table && guestAny.table.trim() !== '';
          }).length;
          const dietaryNeeds = guests.filter(guest => {
            const guestAny = guest as any;
            // Check both possible field names: dietaryRestrictions (frontend) and dietaryRestriction (backend)
            const dietary = guestAny.dietaryRestrictions || guestAny.dietaryRestriction || '';
            return dietary && dietary.trim() !== '' && dietary.toLowerCase() !== 'none';
          }).length;
          const accessibilityNeeds = guests.filter(guest => {
            const guestAny = guest as any;
            // Check both possible field names: accessibilityNeeds (both frontend and backend)
            const accessibility = guestAny.accessibilityNeeds || '';
            return accessibility && accessibility.trim() !== '' && accessibility.toLowerCase() !== 'none';
          }).length;

          return {
            eventId: event.id,
            eventName: event.name,
            totalGuests,
            assignedSeats,
            dietaryNeeds,
            accessibilityNeeds,
            startDate: event.startDate,
            status: event.status
          };
        })
      );

      return breakdown;
    } catch (error) {
      console.error('Error calculating event breakdown:', error);
      return [];
    }
  }
}

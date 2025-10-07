import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Event, Guest, TeamMember, Activity, Invitation, CreateEventForm } from '../types/dashboard';

// Use separate API URL for dashboard operations (json-server)
const API_URL = process.env.REACT_APP_DASHBOARD_API_URL || 'http://localhost:3002';

export class DashboardService {
  // Events
  async getEvents(): Promise<Event[]> {
    try {
      const response = await axios.get<Event[]>(`${API_URL}/events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  async createEvent(eventData: CreateEventForm, userId: string): Promise<Event> {
    try {
      const newEvent: Event = {
        id: uuidv4(),
        ...eventData,
        actualAttendees: 0,
        status: 'draft',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await axios.post<Event>(`${API_URL}/events`, newEvent);

      // Log activity
      await this.logActivity({
        userId,
        userName: 'Current User', // This should be replaced with actual user name
        action: 'Created event',
        details: eventData.name,
        eventId: newEvent.id,
        type: 'event'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  async updateEvent(eventId: string, updates: Partial<Event>, userId: string): Promise<Event> {
    try {
      const updatedEvent = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const response = await axios.patch<Event>(`${API_URL}/events/${eventId}`, updatedEvent);

      // Log activity
      await this.logActivity({
        userId,
        userName: 'Current User',
        action: 'Updated event',
        details: `${updates.name || 'Event'} - Updated`,
        eventId,
        type: 'event'
      });

      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      // Get event details for logging
      const event = await axios.get<Event>(`${API_URL}/events/${eventId}`);

      await axios.delete(`${API_URL}/events/${eventId}`);

      // Log activity
      await this.logActivity({
        userId,
        userName: 'Current User',
        action: 'Deleted event',
        details: event.data.name,
        eventId: null,
        type: 'event'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  // Guests
  async getGuests(): Promise<Guest[]> {
    try {
      const response = await axios.get<Guest[]>(`${API_URL}/guests`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guests:', error);
      throw new Error('Failed to fetch guests');
    }
  }

  async importGuests(guests: Omit<Guest, 'id' | 'importedAt'>[], userId: string): Promise<Guest[]> {
    try {
      const newGuests = guests.map(guest => ({
        ...guest,
        id: uuidv4(),
        importedAt: new Date().toISOString(),
      }));

      const promises = newGuests.map(guest =>
        axios.post<Guest>(`${API_URL}/guests`, guest)
      );

      await Promise.all(promises);

      // Log activity
      await this.logActivity({
        userId,
        userName: 'Current User',
        action: 'Imported guests',
        details: `Added ${newGuests.length} guests`,
        eventId: newGuests[0]?.eventId || null,
        type: 'guest'
      });

      return newGuests;
    } catch (error) {
      console.error('Error importing guests:', error);
      throw new Error('Failed to import guests');
    }
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await axios.get<TeamMember[]>(`${API_URL}/teamMembers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw new Error('Failed to fetch team members');
    }
  }

  async createInvitation(createdBy: string): Promise<Invitation> {
    try {
      const invitation: Invitation = {
        id: uuidv4(),
        code: `SIPANIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdBy,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        used: false,
        usedBy: null,
        usedAt: null,
      };

      const response = await axios.post<Invitation>(`${API_URL}/invitations`, invitation);
      return response.data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    try {
      const response = await axios.get<Activity[]>(`${API_URL}/activities`);
      return response.data.sort((a: Activity, b: Activity) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  async logActivity(activityData: Omit<Activity, 'id' | 'timestamp'>): Promise<Activity> {
    try {
      const activity: Activity = {
        id: uuidv4(),
        ...activityData,
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post<Activity>(`${API_URL}/activities`, activity);
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw here as logging activities shouldn't break main functionality
      return activityData as Activity;
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
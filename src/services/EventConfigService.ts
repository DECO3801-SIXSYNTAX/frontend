// src/services/EventConfigService.ts
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
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface EventConfig {
  id?: string;
  eventId: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
  };
  qrCodes: {
    guestCheckin: boolean;
    seatLookup: boolean;
    generatedAt?: string;
  };
  collaboration: {
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: 'admin' | 'planner' | 'vendor' | 'viewer' | 'editor';
      status?: 'online' | 'away' | 'offline';
      permissions?: {
        editLayout: boolean;
        manageGuests: boolean;
        exportData: boolean;
      };
      addedAt?: string;
      addedBy?: string;
    }>;
  };
  versionHistory: {
    versions: Array<{
      id: string;
      version: string;
      status: 'current' | 'draft' | 'published' | 'archived';
      description: string;
      timestamp: string;
      createdBy: string;
      notes?: Array<{
        id: string;
        note: string;
        createdAt: string;
        createdBy: string;
        version: string;
      }>;
    }>;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class EventConfigService {
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  // Get all event configs (for current user's events)
  async getEventConfigs(): Promise<EventConfig[]> {
    try {
      const configsRef = collection(db, 'eventconfigs');
      const snapshot = await getDocs(configsRef);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as EventConfig;
      });
    } catch (error) {
      console.error('Error fetching event configs:', error);
      throw new Error('Failed to fetch event configs');
    }
  }

  // Get event config by event ID
  async getEventConfigByEventId(eventId: string): Promise<EventConfig | null> {
    try {
      const configsRef = collection(db, 'eventconfigs');
      const q = query(configsRef, where('eventId', '==', eventId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as EventConfig;
    } catch (error) {
      console.error('Error fetching event config:', error);
      throw new Error('Failed to fetch event config');
    }
  }

  // Create or update event config
  async saveEventConfig(config: EventConfig): Promise<EventConfig> {
    try {
      const userId = this.getCurrentUserId();

      // Check if config exists for this event
      const existing = await this.getEventConfigByEventId(config.eventId);

      if (existing && existing.id) {
        // Update existing config
        const configRef = doc(db, 'eventconfigs', existing.id);
        await updateDoc(configRef, {
          branding: config.branding,
          qrCodes: config.qrCodes,
          collaboration: config.collaboration,
          versionHistory: config.versionHistory,
          updatedAt: serverTimestamp(),
        });

        return {
          ...config,
          id: existing.id,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new config
        const configsRef = collection(db, 'eventconfigs');
        const docRef = await addDoc(configsRef, {
          eventId: config.eventId,
          branding: config.branding,
          qrCodes: config.qrCodes,
          collaboration: config.collaboration,
          versionHistory: config.versionHistory,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return {
          ...config,
          id: docRef.id,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error saving event config:', error);
      throw new Error('Failed to save event config');
    }
  }

  // Delete event config
  async deleteEventConfig(configId: string): Promise<void> {
    try {
      const configRef = doc(db, 'eventconfigs', configId);
      await deleteDoc(configRef);
    } catch (error) {
      console.error('Error deleting event config:', error);
      throw new Error('Failed to delete event config');
    }
  }

  // Delete event config by event ID
  async deleteEventConfigByEventId(eventId: string): Promise<void> {
    try {
      const config = await this.getEventConfigByEventId(eventId);
      if (config && config.id) {
        await this.deleteEventConfig(config.id);
      }
    } catch (error) {
      console.error('Error deleting event config:', error);
      throw new Error('Failed to delete event config');
    }
  }
}

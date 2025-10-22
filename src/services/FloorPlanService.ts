// src/services/FloorPlanService.ts
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
import axios from 'axios';

export interface FloorPlan {
  id?: string;
  eventId: string;
  canvasSize: { width: number; height: number };
  pixelsPerMeter: number;
  elements: any[];
  roomBoundary: any;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class FloorPlanService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }

  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  private getAuthToken(): string {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Authentication required. Please sign in.');
    }
    return token;
  }

  // Helper function to remove undefined values (Firestore doesn't support undefined)
  private removeUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefined(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = this.removeUndefined(value);
        }
      });
      return cleaned;
    }

    return obj;
  }

  // Get all floor plans (for current user's events)
  async getFloorPlans(): Promise<FloorPlan[]> {
    try {
      // For now, this would require fetching all events and their floorplan metadata
      // We'll return an empty array as this is typically not needed
      // If needed, implement by iterating through events
      return [];
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      throw new Error('Failed to fetch floor plans');
    }
  }

  // Get floor plan by event ID
  async getFloorPlanByEventId(eventId: string): Promise<FloorPlan | null> {
    try {
      // Get the metadata document at /events/{eventId}/floorplan/metadata
      const metadataRef = doc(db, 'events', eventId, 'floorplan', 'metadata');
      const metadataDoc = await getDoc(metadataRef);

      if (!metadataDoc.exists()) {
        return null;
      }

      const metadata = metadataDoc.data();

      // Get all elements from /events/{eventId}/floorplan/metadata/elements
      const elementsRef = collection(db, 'events', eventId, 'floorplan', 'metadata', 'elements');
      const elementsSnapshot = await getDocs(elementsRef);

      const elements = elementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        id: metadataDoc.id,
        eventId,
        canvasSize: metadata.canvasSize,
        pixelsPerMeter: metadata.pixelsPerMeter,
        roomBoundary: metadata.roomBoundary,
        elements,
        createdAt: metadata.createdAt?.toDate?.()?.toISOString() || metadata.createdAt,
        updatedAt: metadata.updatedAt?.toDate?.()?.toISOString() || metadata.updatedAt,
      } as FloorPlan;
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      throw new Error('Failed to fetch floor plan');
    }
  }

  // Create or update floor plan
  async saveFloorPlan(floorPlan: FloorPlan): Promise<FloorPlan> {
    try {
      const userId = this.getCurrentUserId();

      // Clean the data to remove undefined values (Firestore doesn't support them)
      const cleanedElements = this.removeUndefined(floorPlan.elements);
      const cleanedRoomBoundary = this.removeUndefined(floorPlan.roomBoundary);

      // Save metadata at /events/{eventId}/floorplan/metadata
      const metadataRef = doc(db, 'events', floorPlan.eventId, 'floorplan', 'metadata');
      const metadataDoc = await getDoc(metadataRef);

      const metadataData = {
        canvasSize: floorPlan.canvasSize,
        pixelsPerMeter: floorPlan.pixelsPerMeter,
        roomBoundary: cleanedRoomBoundary,
        updatedAt: serverTimestamp(),
      };

      if (metadataDoc.exists()) {
        // Update existing metadata
        await updateDoc(metadataRef, metadataData);
      } else {
        // Create new metadata
        await setDoc(metadataRef, {
          ...metadataData,
          createdBy: userId,
          createdAt: serverTimestamp(),
        });
      }

      // Get the elements collection reference
      const elementsCollectionRef = collection(db, 'events', floorPlan.eventId, 'floorplan', 'metadata', 'elements');

      // Delete all existing elements first (to handle removed elements)
      const existingElementsSnapshot = await getDocs(elementsCollectionRef);
      const deletePromises = existingElementsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Save each element as a separate document
      const savePromises = cleanedElements.map((element: any) => {
        const elementRef = doc(elementsCollectionRef, element.id);
        return setDoc(elementRef, this.removeUndefined(element));
      });
      await Promise.all(savePromises);

      return {
        ...floorPlan,
        id: 'metadata',
        createdBy: userId,
        createdAt: metadataDoc.exists() ? metadataDoc.data().createdAt?.toDate?.()?.toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error saving floor plan:', error);
      throw new Error('Failed to save floor plan');
    }
  }

  // Delete floor plan
  async deleteFloorPlan(floorPlanId: string): Promise<void> {
    // Not applicable with new structure - use deleteFloorPlanByEventId instead
    throw new Error('Use deleteFloorPlanByEventId instead');
  }

  // Delete floor plan by event ID
  async deleteFloorPlanByEventId(eventId: string): Promise<void> {
    try {
      // Delete all elements first
      const elementsCollectionRef = collection(db, 'events', eventId, 'floorplan', 'metadata', 'elements');
      const elementsSnapshot = await getDocs(elementsCollectionRef);
      const deleteElementsPromises = elementsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteElementsPromises);

      // Delete the metadata document
      const metadataRef = doc(db, 'events', eventId, 'floorplan', 'metadata');
      await deleteDoc(metadataRef);
    } catch (error) {
      console.error('Error deleting floor plan:', error);
      throw new Error('Failed to delete floor plan');
    }
  }

  // ========== Django Backend Methods ==========

  /**
   * Save floor plan with seat assignments to Django backend
   * POST /api/event/layouts/save/
   */
  async saveFloorPlanToDjango(floorPlan: FloorPlan): Promise<FloorPlan> {
    try {
      const token = this.getAuthToken();

      console.log('Saving floor plan to Django backend:', {
        eventId: floorPlan.eventId,
        elementCount: floorPlan.elements.length,
        totalAssignments: floorPlan.elements.reduce((sum: number, el: any) => sum + (el.assignedGuests?.length || 0), 0)
      });

      const response = await axios.post(
        `${this.apiUrl}/api/event/layouts/save/`,
        floorPlan,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Floor plan saved successfully:', {
        eventId: response.data.eventId,
        version: response.data.version
      });

      return response.data;
    } catch (error: any) {
      console.error('Error saving floor plan to Django:', error);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.status === 409) {
        // Version conflict
        throw new Error(`Version conflict. Current version: ${error.response.data.current_version}. Please refresh and try again.`);
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to save floor plan');
      }
    }
  }

  /**
   * Get floor plan by event ID from Django backend
   * GET /api/event/layouts/<event_id>/
   */
  async getFloorPlanFromDjango(eventId: string): Promise<FloorPlan | null> {
    try {
      const token = this.getAuthToken();

      const response = await axios.get(
        `${this.apiUrl}/api/event/layouts/${eventId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Loaded floor plan from Django:', {
        eventId,
        elementCount: response.data.elements?.length || 0,
        version: response.data.version
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('No floor plan found for event:', eventId);
        return null;
      }

      console.error('Error loading floor plan from Django:', error);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to load floor plan');
      }
    }
  }

  /**
   * Get floor plan metadata (version, updatedAt, has_elements)
   * GET /api/event/layouts/meta/<event_id>/
   */
  async getFloorPlanMeta(eventId: string): Promise<{
    version: number;
    updatedAt: string;
    has_elements: boolean;
  } | null> {
    try {
      const token = this.getAuthToken();

      const response = await axios.get(
        `${this.apiUrl}/api/event/layouts/meta/${eventId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      console.error('Error loading floor plan metadata:', error);
      return null;
    }
  }

  /**
   * Assign a guest to a specific seat/element
   * PATCH /api/guest/assign-seat/<event_id>/<guest_id>/
   */
  async assignGuestToSeat(
    eventId: string,
    guestId: string,
    elementId: string
  ): Promise<{
    ok: boolean;
    element: {
      element_id: string;
      element_name: string;
    };
  }> {
    try {
      const token = this.getAuthToken();

      console.log('Assigning guest to seat via Django:', {
        eventId,
        guestId,
        elementId
      });

      const response = await axios.patch(
        `${this.apiUrl}/api/guest/assign-seat/${eventId}/${guestId}/`,
        { element_id: elementId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Guest assigned to seat:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error assigning guest to seat:', error);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (error.response?.status === 404) {
        const detail = error.response.data?.detail || '';
        if (detail.includes('element_not_found')) {
          throw new Error('Seat not found. Please refresh the layout.');
        } else if (detail.includes('guest_not_found')) {
          throw new Error('Guest not found.');
        }
        throw new Error('Resource not found.');
      } else if (error.response?.status === 409) {
        throw new Error('This seat is full. Please choose another seat.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Failed to assign guest to seat');
      }
    }
  }

  /**
   * Get event statistics including seat assignments
   * GET /api/event/<event_id>/stats/
   */
  async getEventStats(eventId: string): Promise<{
    totalGuests: number;
    assignedSeats: number;
    dietaryNeeds: number;
    accessibilityNeeds: number;
    completionRate: number;
  }> {
    try {
      const token = this.getAuthToken();

      const response = await axios.get(
        `${this.apiUrl}/api/event/${eventId}/stats/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error loading event stats:', error);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }

      // Return default values on error
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
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
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
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
}
// src/services/SettingsService.ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface SystemSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  autoSave: boolean;
}

export class SettingsService {
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    return user.uid;
  }

  // Get system settings for current user
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const userId = this.getCurrentUserId();
      const settingsRef = doc(db, 'users', userId, 'settings', 'system');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        return settingsDoc.data() as SystemSettings;
      }

      // Return defaults if not found
      return {
        soundEnabled: true,
        notificationsEnabled: true,
        language: 'en',
        autoSave: true
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // Return defaults on error
      return {
        soundEnabled: true,
        notificationsEnabled: true,
        language: 'en',
        autoSave: true
      };
    }
  }

  // Update system settings for current user
  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const settingsRef = doc(db, 'users', userId, 'settings', 'system');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        // Update existing settings
        await updateDoc(settingsRef, {
          ...settings,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new settings document
        const defaultSettings: SystemSettings = {
          soundEnabled: true,
          notificationsEnabled: true,
          language: 'en',
          autoSave: true
        };

        await setDoc(settingsRef, {
          ...defaultSettings,
          ...settings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw new Error('Failed to update system settings');
    }
  }
}
//src\services\AuthService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Logger } from '../utils/logger';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  role: 'planner' | 'vendor';
  // Planner-specific fields (optional for vendors)
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export interface User {
  id: string;
  email: string;
  password: string; // Not used in Firebase (kept for interface compatibility)
  name: string;
  role: 'planner' | 'vendor';
  // Planner-specific fields (optional for vendors)
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export class AuthService {
  async signIn(data: LoginPayload): Promise<User> {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        password: '', // Firebase doesn't expose password
        name: userData.name || firebaseUser.displayName || '',
        role: userData.role || 'planner',
        company: userData.company,
        phone: userData.phone,
        experience: userData.experience,
        specialty: userData.specialty,
      };

      Logger.info('User logged in successfully', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      return user;
    } catch (err: any) {
      Logger.error('Login failed', err);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      if (err.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }

      throw new Error(err.message || 'Login failed');
    }
  }

  async signUp(data: SignUpPayload): Promise<User> {
    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role) {
      throw new Error('Name, email, password, and role are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate planner-specific fields
    if (data.role === 'planner') {
      if (!data.company || !data.phone || !data.experience || !data.specialty) {
        throw new Error('Company, phone, experience, and specialty are required for planners');
      }

      // Validate phone format (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: data.name
      });

      // Create user profile in Firestore
      const userProfile = {
        email: data.email,
        name: data.name,
        role: data.role,
        ...(data.role === 'planner' && {
          company: data.company,
          phone: data.phone,
          experience: data.experience,
          specialty: data.specialty,
        }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);

      const user: User = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        password: '', // Firebase doesn't expose password
        company: data.company,
        phone: data.phone,
        experience: data.experience,
        specialty: data.specialty,
      };

      Logger.info('User registered successfully', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      return user;
    } catch (err: any) {
      Logger.error('Registration failed', err);

      if (err.code === 'auth/email-already-in-use') {
        throw new Error('User with this email already exists');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      if (err.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw new Error(err.message || 'Registration failed');
    }
  }

  async signInWithGoogle(role?: 'planner' | 'vendor'): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if user profile exists
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userData: any;

      if (!userDoc.exists()) {
        // Create new user profile
        userData = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role: role || 'planner',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userDocRef, userData);
        Logger.info('New Google user created', { email: firebaseUser.email });
      } else {
        userData = userDoc.data();
        Logger.info('Existing Google user logged in', { email: firebaseUser.email });
      }

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        password: '',
        name: userData.name || firebaseUser.displayName || '',
        role: userData.role || 'planner',
        company: userData.company,
        phone: userData.phone,
        experience: userData.experience,
        specialty: userData.specialty,
      };

      return user;
    } catch (err: any) {
      Logger.error('Google sign-in failed', err);

      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      }
      if (err.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      }

      throw new Error(err.message || 'Google sign-in failed');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Logger.info('Password reset email sent', email);
    } catch (err: any) {
      Logger.error('Password reset request failed', err);
      // Don't reveal if email exists for security
      throw new Error('If this email is registered, you will receive a password reset link shortly.');
    }
  }

  async resetPasswordWithToken(code: string, newPassword: string, confirmPassword: string): Promise<void> {
    if (!code || !newPassword || !confirmPassword) {
      throw new Error('Code, new password, and confirmation are required');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      await confirmPasswordReset(auth, code, newPassword);
      Logger.info('Password reset completed successfully');
    } catch (err: any) {
      Logger.error('Password reset failed', err);

      if (err.code === 'auth/invalid-action-code') {
        throw new Error('Invalid or expired reset code. Please request a new password reset.');
      }
      if (err.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }

      throw new Error('Password reset failed. Please try again.');
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const user: User = {
        id: userId,
        email: userData.email || '',
        password: '',
        name: userData.name || '',
        role: userData.role || 'planner',
        company: userData.company,
        phone: userData.phone,
        experience: userData.experience,
        specialty: userData.specialty,
      };

      Logger.info('User profile retrieved successfully', userId);
      return user;
    } catch (err: any) {
      Logger.error('Failed to get user profile', err);
      throw new Error('Failed to get user profile');
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserPayload): Promise<User> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate email format if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Please enter a valid email address');
      }
    }

    // Validate phone format if provided
    if (updates.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(updates.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error('Please enter a valid phone number');
      }
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update Firebase Auth display name if name is changed
      if (updates.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name
        });
      }

      const updatedUser = await this.getUserProfile(userId);
      Logger.info('User profile updated successfully', userId);
      return updatedUser;
    } catch (err: any) {
      Logger.error('Profile update failed', err);
      throw new Error('Profile update failed');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      // Re-authenticate user before changing password
      const credential = await signInWithEmailAndPassword(auth, user.email, currentPassword);

      // Change password (would need to import updatePassword from firebase/auth)
      // Note: Firebase doesn't have a direct password change method that takes old password
      // This is a simplified version

      throw new Error('Password change not yet implemented. Please use password reset.');

    } catch (err: any) {
      Logger.error('Password change failed', err);

      if (err.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      }

      throw new Error(err.message || 'Password change failed');
    }
  }

  async validateSession(userId: string): Promise<User> {
    try {
      const user = await this.getUserProfile(userId);
      return user;
    } catch (err: any) {
      throw new Error('Invalid session');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      Logger.info('User logged out successfully');
    } catch (err: any) {
      Logger.error('Logout failed', err);
      throw new Error('Logout failed');
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Logger } from '../utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'planner' | 'vendor' | 'guest';
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
  is_active?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'planner' | 'vendor' | 'guest';
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface GoogleLoginResponse {
  access: string;
  refresh: string;
  user: User;
  is_new_user: boolean;
  login_provider: string;
}

// ============================================================================
// Unified Authentication Service
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export class UnifiedAuthService {
  private readonly API_URL = API_BASE;

  // ==========================================================================
  // Email/Password Authentication (Django Backend + Firebase Fallback)
  // ==========================================================================

  /**
   * Login with email and password - LANGSUNG KE FIREBASE
   * 
   * Flow:
   * 1. Authenticate dengan Firebase Auth
   * 2. Ambil user profile dari Firestore
   * 3. Store ke localStorage
   * 4. Return user data
   */
  async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    try {
      Logger.info('Attempting Firebase login', { email });
      
      // Step 1: Sign in dengan Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = userCredential.user;

      Logger.info('Firebase authentication successful', { uid: firebaseUser.uid });

      // Step 2: Ambil user profile dari Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Jika user tidak ada di Firestore, buat profile baru
        Logger.warn('User not found in Firestore, creating new profile');
        
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || '',
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'planner', // default role
          is_active: true
        };

        // Simpan ke Firestore
        await setDoc(userDocRef, {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Store ke localStorage
        this.storeFirebaseAuthData(newUser, firebaseUser);

        Logger.info('User profile created successfully');
        return newUser;
      }

      // Step 3: User ada di Firestore, ambil datanya
      const userData = userDoc.data();
      const user: User = {
        id: firebaseUser.uid,
        username: userData.email?.split('@')[0] || '',
        email: userData.email || firebaseUser.email || '',
        name: userData.name || firebaseUser.displayName || 'User',
        role: userData.role || 'planner',
        company: userData.company,
        phone: userData.phone,
        experience: userData.experience,
        specialty: userData.specialty,
        is_active: userData.is_active !== false
      };

      // Store ke localStorage
      this.storeFirebaseAuthData(user, firebaseUser);

      Logger.info('User logged in successfully', {
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error: any) {
      Logger.error('Firebase login failed', error);
      
      // Handle specific Firebase error codes
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled.');
      }
      
      throw error;
    }
  }

  /**
   * Store Firebase authentication data ke localStorage
   */
  private storeFirebaseAuthData(user: User, firebaseUser: any): void {
    // Store user data
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userId', user.id);
    
    // Store Firebase UID untuk reference
    localStorage.setItem('firebaseUid', firebaseUser.uid);
    
    Logger.info('Authentication data stored in localStorage');
  }

  /**
   * Sign up new user - LANGSUNG KE FIREBASE
   * 
   * Flow:
   * 1. Create user di Firebase Authentication
   * 2. Simpan profile ke Firestore
   * 3. Auto-login
   */
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
      Logger.info('Creating new user in Firebase', { email: data.email });

      // Step 1: Create user di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth, 
        data.email, 
        data.password
      );
      const firebaseUser = userCredential.user;

      Logger.info('Firebase user created', { uid: firebaseUser.uid });

      // Step 2: Create user profile di Firestore
      const userProfile = {
        email: data.email,
        name: data.name,
        role: data.role.toLowerCase(),
        company: data.company || null,
        phone: data.phone || null,
        experience: data.experience || null,
        specialty: data.specialty || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_active: true
      };

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, userProfile);

      Logger.info('User profile created in Firestore');

      const user: User = {
        id: firebaseUser.uid,
        username: data.email.split('@')[0],
        email: data.email,
        name: data.name,
        role: data.role,
        company: data.company,
        phone: data.phone,
        experience: data.experience,
        specialty: data.specialty,
        is_active: true
      };

      // Store authentication data
      this.storeFirebaseAuthData(user, firebaseUser);

      Logger.info('User registered successfully', {
        email: user.email,
        role: user.role
      });

      return user;
    } catch (error: any) {
      Logger.error('Firebase registration failed', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User with this email already exists');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth - LANGSUNG KE FIREBASE
   * 
   * Flow:
   * 1. Google OAuth popup
   * 2. Cek/create profile di Firestore
   * 3. Return user data
   */
  async signInWithGoogle(role?: 'planner' | 'vendor' | 'admin' | 'guest'): Promise<User> {
    try {
      Logger.info('Starting Google OAuth');

      // Step 1: Google OAuth popup
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      const firebaseUser = userCredential.user;

      Logger.info('Google OAuth successful', { uid: firebaseUser.uid });

      // Step 2: Cek apakah user sudah ada di Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let user: User;

      if (!userDoc.exists()) {
        // User baru, create profile
        Logger.info('New Google user, creating profile');

        user = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || '',
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'User',
          role: role || 'planner',
          is_active: true
        };

        await setDoc(userDocRef, {
          email: user.email,
          name: user.name,
          role: user.role,
          photoURL: firebaseUser.photoURL || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loginProvider: 'google'
        });
      } else {
        // User sudah ada
        const userData = userDoc.data();
        user = {
          id: firebaseUser.uid,
          username: userData.email?.split('@')[0] || '',
          email: userData.email || firebaseUser.email || '',
          name: userData.name || firebaseUser.displayName || 'User',
          role: userData.role || 'planner',
          company: userData.company,
          phone: userData.phone,
          experience: userData.experience,
          specialty: userData.specialty,
          is_active: userData.is_active !== false
        };
      }

      // Store authentication data
      this.storeFirebaseAuthData(user, firebaseUser);

      Logger.info('Google login successful', {
        email: user.email,
        isNewUser: !userDoc.exists()
      });

      return user;
    } catch (error: any) {
      Logger.error('Google sign-in failed', error);

      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      }

      throw error;
    }
  }

  // ==========================================================================
  // Token Management
  // ==========================================================================

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.API_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // Refresh token expired - logout user
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();
      
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        Logger.info('Access token refreshed successfully');
        return data.access;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      Logger.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return {
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ==========================================================================
  // Password Reset
  // ==========================================================================

  /**
   * Request password reset email
   */
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
      const response = await fetch(`${this.API_URL}/api/auth/password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset request failed');
      }

      Logger.info('Password reset email sent', email);
    } catch (error) {
      Logger.error('Password reset request failed', error);
      // Don't reveal if email exists for security
      throw new Error('If this email is registered, you will receive a password reset link shortly.');
    }
  }

  /**
   * Reset password with token
   */
  async resetPasswordWithToken(uid: string, token: string, newPassword: string, confirmPassword: string): Promise<void> {
    if (!uid || !token || !newPassword || !confirmPassword) {
      throw new Error('All fields are required');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
      const response = await fetch(`${this.API_URL}/api/auth/password-reset-confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, token, password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Password reset failed');
      }

      Logger.info('Password reset completed successfully');
    } catch (error) {
      Logger.error('Password reset failed', error);
      throw error;
    }
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Store authentication data in localStorage
   */
  private storeAuthData(data: LoginResponse | GoogleLoginResponse): void {
    // Clear any existing session first
    this.clearOldSession();

    // Store tokens
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }

    // Store user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userId', data.user.id);
    }

    Logger.info('Authentication data stored in localStorage');
  }

  /**
   * Clear old session data
   * 
   * This prevents conflicts when switching between users
   */
  private clearOldSession(): void {
    const keysToRemove = [
      'access_token',
      'refresh_token', 
      'user',
      'userEmail',
      'userRole',
      'userId',
      // Legacy keys
      'token',
      'currentUser',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Logout user - FIREBASE
   */
  async logout(): Promise<void> {
    try {
      // Sign out dari Firebase
      await firebaseSignOut(firebaseAuth);
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('firebaseUid');

      Logger.info('User logged out successfully');
    } catch (error: any) {
      Logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      // Try to refresh token to validate session
      await this.refreshToken();
      return this.getCurrentUser();
    } catch {
      // Session invalid - logout
      await this.logout();
      return null;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const authService = new UnifiedAuthService();
export default authService;

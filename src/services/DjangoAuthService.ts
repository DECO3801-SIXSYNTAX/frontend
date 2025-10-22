/**
 * Django Backend Authentication Service
 * 
 * Handles authentication with Django REST Framework JWT endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export interface DjangoUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'planner' | 'vendor' | 'guest';
  company?: string;
  phone?: string;
  is_active?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
}

export interface RegisterPayload {
  username?: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'planner' | 'vendor' | 'guest';
  company?: string;
}

export interface GoogleLoginPayload {
  id_token: string;
  role?: string;
}

export interface GoogleLoginResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
  is_new_user: boolean;
  login_provider: string;
}

export class DjangoAuthService {
  /**
   * Login with email/username and password
   */
  async login(usernameOrEmail: string, password: string): Promise<LoginResponse> {
    // Django authenticate() only works with username, not email
    // Try multiple strategies:
    
    let lastError: any = null;
    
    // Strategy 1: Try as-is (might be username)
    try {
      const response1 = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      });

      if (response1.ok) {
        const data = await response1.json();
        this.storeAuthData(data);
        return data;
      }
      
      const error1 = await response1.text();
      lastError = error1;
    } catch (err) {
      lastError = err;
    }

    // Strategy 2: If looks like email, try username part before @
    if (usernameOrEmail.includes('@')) {
      const usernameFromEmail = usernameOrEmail.split('@')[0];
      
      try {
        const response2 = await fetch(`${API_BASE}/auth/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: usernameFromEmail, password }),
        });

        if (response2.ok) {
          const data = await response2.json();
          this.storeAuthData(data);
          return data;
        }
        
        const error2 = await response2.text();
        lastError = error2;
      } catch (err) {
        lastError = err;
      }
    }

    // All strategies failed
    throw new Error(lastError || 'Invalid credentials');
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuthData(data: LoginResponse): void {
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
    }
  }

  /**
   * Register a new user
   */
  async register(payload: RegisterPayload): Promise<DjangoUser> {
    // If no username provided, use email
    if (!payload.username) {
      payload.username = payload.email;
    }

    // Backend requires password2 for confirmation
    const registerData = {
      ...payload,
      password2: payload.password,  // Add password confirmation
      role: payload.role?.toLowerCase() || 'guest'  // Ensure lowercase role
    };

    const response = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Registration failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Login with Google OAuth
   */
  async googleLogin(idToken: string, role?: string): Promise<GoogleLoginResponse> {
    const response = await fetch(`${API_BASE}/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken, role }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Google login failed: ${response.status}`);
    }

    const data = await response.json();
    
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
    }

    return data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token expired or invalid - clear storage
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      return data.access;
    }

    throw new Error('Failed to refresh token');
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/password-reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Password reset request failed: ${response.status}`);
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(uid: string, token: string, password: string): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/password-reset-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, token, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Password reset failed: ${response.status}`);
    }
  }

  /**
   * Logout - clear all stored data
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): DjangoUser | null {
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
    return !!localStorage.getItem('access_token');
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
}

// Export singleton instance
export const djangoAuth = new DjangoAuthService();

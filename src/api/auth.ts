//src\api\auth.ts
import axios from "axios";
import { LoginPayload, User, SignUpPayload } from "../services/AuthService";
import { DashboardService } from "../services/DashboardService";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function apiLogin(data: LoginPayload): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/users`);
  return res.data;
}

export async function apiUpdateUser(userId: string, userData: Partial<User>): Promise<User> {
  const url = `${API_URL}/users/${userId}`;
  console.log('Update URL:', url);
  
  // Use PATCH to update only specific fields
  const res = await axios.patch<User>(url, userData);
  return res.data;
}

export async function apiCreateUser(userData: SignUpPayload): Promise<User> {
  // Map frontend SignUpPayload to Django RegisterSerializer format
  const djangoPayload = {
    username: userData.email,  // Use email as username
    email: userData.email,
    password: userData.password,
    password2: userData.password,  // Django expects password confirmation
    first_name: userData.name,
    last_name: '',  // Optional, can be empty
    role: userData.role,
    company: userData.company || '',
    // Note: phone, experience, specialty are stored in User model but not required by RegisterSerializer
  };
  
  console.log('Creating Django user with data:', {
    username: djangoPayload.username,
    email: djangoPayload.email,
    role: djangoPayload.role,
    company: djangoPayload.company
  });
  
  const res = await axios.post<any>(`${API_URL}/api/auth/register/`, djangoPayload);
  
  // Map Django response back to frontend User format
  const djangoUser = res.data;
  const user: User = {
    id: djangoUser.id,
    email: djangoUser.email,
    password: '',  // Never expose password
    name: djangoUser.name || djangoUser.first_name || '',
    role: djangoUser.role,
    company: djangoUser.company,
    phone: userData.phone,
    experience: userData.experience,
    specialty: userData.specialty,
  };
  
  return user;
}

export async function apiGetUser(userId: string): Promise<User> {
  const res = await axios.get<User>(`${API_URL}/users/${userId}`);
  return res.data;
}

export async function apiCheckEmailExists(email: string): Promise<boolean> {
  try {
    const users = await apiLogin({ email: "", password: "" });
    return users.some(user => user.email === email);
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

export async function apiDeleteUser(userId: string): Promise<void> {
  await axios.delete(`${API_URL}/users/${userId}`);
}

export async function apiGetAllUsers(): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/users`);
  return res.data;
}

// Google Authentication API
export interface GoogleAuthResponse {
  refresh: string;
  access: string;
  user: User;
  is_new_user: boolean;
  login_provider: string;
}

// Mock Google authentication function for development (only used when Django is completely unavailable)
async function mockGoogleAuth(idToken: string, role?: string): Promise<GoogleAuthResponse> {
  console.log('Using mock Google authentication with Firebase');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create or get existing user from Firebase
  try {
    const dashboardService = new DashboardService();
    const users = await dashboardService.getUsers();
    let user = users.find(u => u.email === 'googleuser@gmail.com');

    if (!user) {
      // For mock authentication, create a default user object
      // In real implementation, Firebase Auth would handle this
      user = {
        id: generateUUID(),
        email: 'googleuser@gmail.com',
        password: 'oauth-mock',
        name: 'Google User',
        role: (role as any) || 'planner',
        company: 'Google',
        phone: '+1234567890',
        experience: '3+ years',
        specialty: 'Digital Events'
      };
    }

    // Generate mock JWT tokens
    const mockAccess = `mock-access-token-${Date.now()}`;
    const mockRefresh = `mock-refresh-token-${Date.now()}`;

    return {
      access: mockAccess,
      refresh: mockRefresh,
      user: user,
      is_new_user: users.length === 0,
      login_provider: 'google-mock'
    };
  } catch (error) {
    console.error('Mock Google auth error:', error);
    throw new Error('Mock authentication failed');
  }
}

export async function apiGoogleLogin(idToken: string, role?: string): Promise<GoogleAuthResponse> {
  const payload = {
    id_token: idToken,
    ...(role && { role })
  };

  console.log('Sending Google auth request to Django backend:', {
    url: `${API_URL}/api/auth/google/`,
    hasIdToken: !!idToken,
    idTokenLength: idToken?.length,
    role: role,
    payload: payload
  });

  try {
    const res = await axios.post<GoogleAuthResponse>(`${API_URL}/api/auth/google/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('✓ Django backend Google auth successful:', {
      status: res.status,
      hasData: !!res.data,
      dataKeys: res.data ? Object.keys(res.data) : []
    });

    return res.data;
  } catch (error: any) {
    console.error('✗ Django backend Google auth error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      url: error.config?.url,
      requestPayload: payload
    });

    // Only fall back to mock if Django is completely unreachable (network error)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('⚠ Django backend unreachable, falling back to mock authentication');
      return await mockGoogleAuth(idToken, role);
    }

    // For 400 errors, the issue is with the token/request - don't fall back, throw the error
    throw error;
  }
}

// Email/Password Authentication API
export interface DjangoLoginResponse {
  refresh: string;
  access: string;
  user: User;
}

export async function apiDjangoLogin(email: string, password: string): Promise<DjangoLoginResponse> {
  const payload = {
    username: email,  // Django expects 'username' field
    password: password
  };

  console.log('Sending email/password login request to Django backend:', {
    url: `${API_URL}/api/auth/login/`,
    email: email
  });

  try {
    const res = await axios.post<DjangoLoginResponse>(`${API_URL}/api/auth/login/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('✓ Django backend login successful:', {
      status: res.status,
      hasData: !!res.data,
      dataKeys: res.data ? Object.keys(res.data) : []
    });

    return res.data;
  } catch (error: any) {
    console.error('✗ Django backend login error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      url: error.config?.url
    });

    throw error;
  }
}
import axios from "axios";
import { LoginPayload, User, SignUpPayload } from "../services/AuthService";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
const DASHBOARD_API_URL = process.env.REACT_APP_DASHBOARD_API_URL || "http://localhost:3002";

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
  // Generate UUID for new user
  const newUserData: User = {
    ...userData,
    id: generateUUID()
  };
  
  console.log('Creating user with data:', newUserData);
  
  const res = await axios.post<User>(`${API_URL}/users`, newUserData);
  return res.data;
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

// Mock Google authentication function for development
async function mockGoogleAuth(idToken: string, role?: string): Promise<GoogleAuthResponse> {
  console.log('Using mock Google authentication with json-server');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create or get existing user from json-server (not Django)
  try {
    const response = await axios.get<User[]>(`${DASHBOARD_API_URL}/users`);
    const users = response.data;
    let user = users.find(u => u.email === 'googleuser@gmail.com');

    if (!user) {
      // Create new Google user in json-server
      const newUserData: User = {
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

      const createResponse = await axios.post<User>(`${DASHBOARD_API_URL}/users`, newUserData);
      user = createResponse.data;
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

  console.log('Sending Google auth request:', {
    url: `${API_URL}/api/auth/google/`,
    hasIdToken: !!idToken,
    idTokenLength: idToken?.length,
    role: role,
    payloadKeys: Object.keys(payload)
  });

  try {
    const res = await axios.post<GoogleAuthResponse>(`${API_URL}/api/auth/google/`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('Google auth API response:', {
      status: res.status,
      statusText: res.statusText,
      hasData: !!res.data,
      dataKeys: res.data ? Object.keys(res.data) : []
    });

    return res.data;
  } catch (error: any) {
    console.error('Google auth API error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });

    // If Django backend fails with 400 status (Invalid token), fall back to mock
    if (error.response?.status === 400 || error.response?.status === 500 || error.code === 'ERR_NETWORK') {
      console.warn('Django backend failed, falling back to mock Google authentication');
      return await mockGoogleAuth(idToken, role);
    }

    throw error;
  }
}
//src\api\auth.ts
/**
 * Legacy auth.ts - Only keeping Google Login for GoogleButton component
 * For new code, use UnifiedAuthService instead
 */
import axios from "axios";
import { User } from "../services/UnifiedAuthService";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Google Authentication API
export interface GoogleAuthResponse {
  refresh: string;
  access: string;
  user: User;
  is_new_user: boolean;
  login_provider: string;
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

    throw error;
  }
}
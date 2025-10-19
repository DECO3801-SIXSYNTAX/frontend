//src\components\GoogleButton.tsx
import React, { useEffect, useRef, useState } from "react";
import { apiGoogleLogin } from "../api/auth";
import { User } from "../services/AuthService";

// Global types for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleButtonProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  role?: 'planner' | 'vendor';
}

export default function GoogleButton({ onSuccess, onError, role }: GoogleButtonProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!window.google || !googleButtonRef.current) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId || clientId === "your-google-client-id") {
        console.log('⚠️  Google Client ID not configured - Google Sign-In disabled');
        setShowFallback(true);
        return;
      }

      console.log('Initializing Google Sign-In with client ID:', clientId.substring(0, 10) + '...');

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: "outline",
          size: "large",
          width: 320, // Fixed width in pixels instead of percentage
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left"
        }
      );
    };

    loadGoogleScript();

    // Set timeout to show fallback if Google services fail to load
    const timeout = setTimeout(() => {
      if (!window.google) {
        console.warn('Google Identity Services failed to load, showing fallback');
        setShowFallback(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const handleFallbackLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Use mock authentication with a fake token
      const mockToken = `mock-google-token-${Date.now()}`;
      const authResponse = await apiGoogleLogin(mockToken, role);

      // Store JWT tokens for future API calls
      localStorage.setItem('access_token', authResponse.access);
      localStorage.setItem('refresh_token', authResponse.refresh);

      // Call success callback with user data
      onSuccess?.(authResponse.user);
    } catch (error: any) {
      console.error('Fallback authentication error:', error);
      onError?.('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
    try {
      console.log('Google credential received:', {
        hasCredential: !!response.credential,
        credentialLength: response.credential?.length,
        selectBy: response.select_by,
        role: role
      });

      // Call the Django backend with the Google ID token (with fallback to mock)
      const authResponse = await apiGoogleLogin(response.credential, role);

      console.log('Google auth success:', {
        hasAccess: !!authResponse.access,
        hasRefresh: !!authResponse.refresh,
        userId: authResponse.user?.id,
        isNewUser: authResponse.is_new_user,
        loginProvider: authResponse.login_provider,
        isMockAuth: authResponse.access?.startsWith('mock-')
      });

      // Show success message based on authentication method
      if (authResponse.access?.startsWith('mock-')) {
        console.info('✓ Using development authentication mode');
      }

      // Store JWT tokens for future API calls
      localStorage.setItem('access_token', authResponse.access);
      localStorage.setItem('refresh_token', authResponse.refresh);

      // Call success callback with user data
      onSuccess?.(authResponse.user);

    } catch (error: any) {
      console.error('Google authentication error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = "Google sign-in failed. Please try again.";
      let debugInfo = "";

      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.detail) {
          debugInfo = ` (${errorData.detail})`;
        } else if (errorData?.error) {
          debugInfo = ` (${errorData.error})`;
        } else if (typeof errorData === 'string') {
          debugInfo = ` (${errorData})`;
        }
        errorMessage = `Invalid request${debugInfo}. Please try again.`;
      } else if (error.response?.status === 401) {
        errorMessage = "Google authentication failed. Please try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access forbidden. Please check your account permissions.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      }

      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full">
      {!showFallback ? (
        <>
          {/* Google Sign-In button will be rendered here */}
          <div
            ref={googleButtonRef}
            className="w-full flex items-center justify-center"
          />
        </>
      ) : (
        /* Fallback button when Google Services fail to load */
        <button
          onClick={handleFallbackLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Signing in...
            </>
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Continue with Google (Dev Mode)
            </>
          )}
        </button>
      )}

      {/* NoScript fallback */}
      <noscript>
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
        >
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            className="h-5 w-5"
          />
          Continue with Google (JavaScript required)
        </button>
      </noscript>
    </div>
  );
}

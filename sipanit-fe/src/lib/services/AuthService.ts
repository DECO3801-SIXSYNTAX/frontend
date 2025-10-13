import axios from "axios";
import { apiLogin, apiUpdateUser, apiCreateUser, apiCheckEmailExists, apiGetUser } from "../api/auth";
import { Logger } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Django API response types
interface DjangoLoginResponse {
  user: User;
  access: string;
  refresh: string;
}

interface DjangoRegisterResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  role: 'admin';
  // Admin-specific fields (optional)
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

export interface User {
  id: string; // Changed to string for UUID
  email: string;
  password: string;
  name: string;
  role: 'admin';
  // Admin-specific fields (optional)
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
      throw new Error("Email and password are required");
    }

    try {
      // Use Django authentication endpoint
      const response = await axios.post<DjangoLoginResponse>(`${API_URL}/api/auth/login/`, {
        username: data.email, // Django expects username field
        password: data.password
      });

      const { user, access, refresh } = response.data;

      // Store JWT tokens for future API calls
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      Logger.info("User logged in successfully", {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
      return user;
    } catch (err: any) {
      if (err.response?.status === 401) {
        Logger.warn("Invalid login attempt", data.email);
        throw new Error("Invalid credentials");
      }

      Logger.error("Login failed due to network/backend error", err);
      throw new Error(err.response?.data?.detail || "Login failed");
    }
  }

  async signUp(data: SignUpPayload): Promise<User> {
    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role) {
      throw new Error("Name, email, password, and role are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Please enter a valid email address");
    }

    // Validate password strength
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Validate admin-specific fields (optional for now)
    if (data.company || data.phone || data.experience || data.specialty) {
      // Validate phone format if provided
      if (data.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
          throw new Error("Please enter a valid phone number");
        }
      }
    }

    try {
      // Use Django registration endpoint
      const response = await axios.post<DjangoRegisterResponse>(`${API_URL}/api/auth/register/`, {
        username: data.email, // Django expects username field
        email: data.email,
        password: data.password,
        password2: data.password, // Django requires password confirmation
        first_name: data.name,
        role: data.role,
        company: data.company,
        phone: data.phone,
        experience: data.experience,
        specialty: data.specialty
      });

      const user: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role as "admin",
        password: data.password, // Include password for User interface compatibility
        company: response.data.company,
        phone: response.data.phone,
        experience: response.data.experience,
        specialty: response.data.specialty
      };

      Logger.info("User registered successfully", {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      return user;
    } catch (err: any) {
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.username && errorData.username.includes("already exists")) {
          throw new Error("User with this email already exists");
        }
        if (errorData.email && errorData.email.includes("already exists")) {
          throw new Error("User with this email already exists");
        }
        // Handle other validation errors
        const firstError = Object.values(errorData)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          throw new Error(firstError[0]);
        }
      }

      Logger.error("Registration failed", err);
      throw new Error(err.response?.data?.detail || "Registration failed");
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    try {
      // Use Django password reset endpoint (sends email with reset token)
      await axios.post(`${API_URL}/api/auth/password-reset/`, {
        email: email
      });

      Logger.info("Password reset email sent", email);
    } catch (err: any) {
      Logger.error("Password reset request failed", err);
      // Always show the same message for security (don't reveal if email exists)
      throw new Error("If this email is registered, you will receive a password reset link shortly.");
    }
  }

  async resetPasswordWithToken(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    if (!token || !newPassword || !confirmPassword) {
      throw new Error("Token, new password, and confirmation are required");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    try {
      // Use Django password reset confirm endpoint
      await axios.post(`${API_URL}/api/auth/password-reset-confirm/`, {
        token: token,
        password: newPassword,
        password2: confirmPassword
      });

      Logger.info("Password reset completed successfully");
    } catch (err: any) {
      Logger.error("Password reset failed", err);
      if (err.response?.status === 400) {
        throw new Error("Invalid or expired reset token. Please request a new password reset.");
      }
      throw new Error("Password reset failed. Please try again.");
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const user = await apiGetUser(userId);

      Logger.info("User profile retrieved successfully", userId);
      return user;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error("User not found");
      }

      Logger.error("Failed to get user profile", err);
      throw new Error("Failed to get user profile");
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserPayload): Promise<User> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate email format if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Check if new email already exists (exclude current user)
      const emailExists = await apiCheckEmailExists(updates.email);
      if (emailExists) {
        const users = await apiLogin({ email: "", password: "" });
        const existingUser = users.find((u: User) => u.email === updates.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error("Email address is already in use");
        }
      }
    }

    // Validate phone format if provided
    if (updates.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(updates.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error("Please enter a valid phone number");
      }
    }

    try {
      const updatedUser = await apiUpdateUser(userId, updates);

      Logger.info("User profile updated successfully", userId);
      return updatedUser;
    } catch (err: any) {
      if (err.response?.status === 404) {
        throw new Error("User not found");
      }

      Logger.error("Profile update failed", err);
      throw new Error("Profile update failed");
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!userId || !currentPassword || !newPassword) {
      throw new Error("User ID, current password, and new password are required");
    }

    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    try {
      // Get current user to verify current password
      const currentUser = await apiGetUser(userId);

      if (currentUser.password !== currentPassword) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      await apiUpdateUser(userId, {
        password: newPassword
      } as any);

      Logger.info("Password changed successfully", userId);
    } catch (err: any) {
      if (err.message === "Current password is incorrect") {
        throw err;
      }
      if (err.response?.status === 404) {
        throw new Error("User not found");
      }

      Logger.error("Password change failed", err);
      throw new Error("Password change failed");
    }
  }

  async validateSession(userId: string): Promise<User> {
    try {
      const user = await this.getUserProfile(userId);
      return user;
    } catch (err: any) {
      throw new Error("Invalid session");
    }
  }
}

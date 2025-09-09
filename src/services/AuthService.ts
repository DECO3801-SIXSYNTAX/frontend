import { apiLogin, apiUpdateUser, apiCreateUser, apiCheckEmailExists, apiGetUser } from "../api/auth";
import { Logger } from "../utils/logger";

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
  id: string; // Changed to string for UUID
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
      // Get list of users from API
      const users = await apiLogin(data);

      // Find user with matching email and password
      const user = users.find(
        (u) => u.email === data.email && u.password === data.password
      );

      if (!user) {
        Logger.warn("Invalid login attempt", data.email);
        throw new Error("Invalid credentials");
      }

      Logger.info("User logged in successfully", { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      });
      return user;
    } catch (err: any) {
      if (err.message === "Invalid credentials") {
        throw err;
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

    // Validate planner-specific fields
    if (data.role === 'planner') {
      if (!data.company || !data.phone || !data.experience || !data.specialty) {
        throw new Error("Company, phone, experience, and specialty are required for planners");
      }

      // Validate phone format (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new Error("Please enter a valid phone number");
      }
    }

    try {
      // Check if user with this email already exists
      const emailExists = await apiCheckEmailExists(data.email);
      if (emailExists) {
        throw new Error("User with this email already exists");
      }

      // Create new user
      const newUser = await apiCreateUser(data);
      
      Logger.info("User registered successfully", { 
        id: newUser.id, 
        email: newUser.email, 
        name: newUser.name,
        role: newUser.role 
      });
      
      return newUser;
    } catch (err: any) {
      if (err.message === "User with this email already exists") {
        throw err;
      }

      Logger.error("Registration failed", err);
      throw new Error(err.response?.data?.detail || "Registration failed");
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    if (!email || !newPassword) {
      throw new Error("Email and new password are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    try {
      // Get all users to find the one with matching email
      const users = await apiLogin({ email: "", password: "" });
      const userToUpdate = users.find((user: User) => user.email === email);
      
      if (!userToUpdate) {
        throw new Error("Email address not found");
      }

      // Update only the password field
      await apiUpdateUser(userToUpdate.id, {
        password: newPassword
      });

      Logger.info("Password reset successfully", email);
    } catch (err: any) {
      if (err.message === "Email address not found") {
        throw err;
      }

      Logger.error("Password reset failed", err);
      throw new Error(err.response?.data?.detail || "Password reset failed");
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
        const existingUser = users.find(u => u.email === updates.email);
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
      });

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
import axios from "axios";
import { AuthService, User, SignUpPayload, UpdateUserPayload } from "../services/AuthService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("AuthService", () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signIn", () => {
    it("throws error if email/password missing", async () => {
      await expect(
        service.signIn({ email: "", password: "" })
      ).rejects.toThrow("Email and password are required");
    });

    it("returns user data when login success", async () => {
      const fakeUsers: User[] = [
        { 
          id: "550e8400-e29b-41d4-a716-446655440001", 
          email: "test@test.com", 
          password: "123456", 
          name: "Test User",
          role: "planner",
          company: "Test Company",
          phone: "+1234567890",
          experience: "5+ years",
          specialty: "Corporate Events"
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: fakeUsers } as any);

      const res = await service.signIn({
        email: "test@test.com",
        password: "123456",
      });

      expect(res).toEqual(fakeUsers[0]);
    });

    it("throws error when credentials invalid", async () => {
      const fakeUsers: User[] = [
        { 
          id: "550e8400-e29b-41d4-a716-446655440001", 
          email: "test@test.com", 
          password: "123456", 
          name: "Test User",
          role: "planner"
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: fakeUsers } as any);

      await expect(
        service.signIn({ email: "wrong@test.com", password: "wrongpass" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("signUp", () => {
    it("throws error if required fields missing", async () => {
      await expect(
        service.signUp({ 
          name: "", 
          email: "test@test.com", 
          password: "123456", 
          role: "planner" 
        })
      ).rejects.toThrow("Name, email, password, and role are required");
    });

    it("throws error for invalid email", async () => {
      await expect(
        service.signUp({ 
          name: "Test", 
          email: "invalid-email", 
          password: "123456", 
          role: "vendor" 
        })
      ).rejects.toThrow("Please enter a valid email address");
    });

    it("throws error for weak password", async () => {
      await expect(
        service.signUp({ 
          name: "Test", 
          email: "test@test.com", 
          password: "123", 
          role: "vendor" 
        })
      ).rejects.toThrow("Password must be at least 6 characters long");
    });

    it("throws error if planner fields missing", async () => {
      await expect(
        service.signUp({ 
          name: "Test", 
          email: "test@test.com", 
          password: "123456", 
          role: "planner" 
        })
      ).rejects.toThrow("Company, phone, experience, and specialty are required for planners");
    });

    it("throws error for invalid phone number", async () => {
      await expect(
        service.signUp({ 
          name: "Test Planner", 
          email: "planner@test.com", 
          password: "123456", 
          role: "planner",
          company: "Test Company",
          phone: "invalid-phone",
          experience: "5+ years",
          specialty: "Corporate Events"
        })
      ).rejects.toThrow("Please enter a valid phone number");
    });

    it("creates vendor successfully", async () => {
      const signUpData: SignUpPayload = {
        name: "Test Vendor",
        email: "vendor@test.com",
        password: "123456",
        role: "vendor"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...signUpData
      };

      // Mock email check (no existing users)
      mockedAxios.get.mockResolvedValueOnce({ data: [] } as any);
      // Mock user creation
      mockedAxios.post.mockResolvedValueOnce({ data: expectedUser } as any);

      const result = await service.signUp(signUpData);
      expect(result).toEqual(expectedUser);
    });

    it("creates planner successfully", async () => {
      const signUpData: SignUpPayload = {
        name: "Test Planner",
        email: "planner@test.com",
        password: "123456",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        ...signUpData
      };

      // Mock email check (no existing users)
      mockedAxios.get.mockResolvedValueOnce({ data: [] } as any);
      // Mock user creation
      mockedAxios.post.mockResolvedValueOnce({ data: expectedUser } as any);

      const result = await service.signUp(signUpData);
      expect(result).toEqual(expectedUser);
    });

    it("throws error when email already exists", async () => {
      const signUpData: SignUpPayload = {
        name: "Test User",
        email: "existing@test.com",
        password: "123456",
        role: "vendor"
      };

      const existingUsers: User[] = [
        { 
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: "existing@test.com",
          password: "oldpass",
          name: "Existing User",
          role: "vendor"
        }
      ];

      // Mock email check (user exists)
      mockedAxios.get.mockResolvedValueOnce({ data: existingUsers } as any);

      await expect(service.signUp(signUpData))
        .rejects.toThrow("User with this email already exists");
    });
  });

  describe("resetPassword", () => {
    it("resets password successfully", async () => {
      const email = "test@test.com";
      const newPassword = "newpassword123";
      
      const existingUsers: User[] = [
        { 
          id: "550e8400-e29b-41d4-a716-446655440001",
          email: email,
          password: "oldpassword",
          name: "Test User",
          role: "vendor"
        }
      ];

      const updatedUser: User = {
        ...existingUsers[0],
        password: newPassword
      };

      // Mock getting users
      mockedAxios.get.mockResolvedValueOnce({ data: existingUsers } as any);
      // Mock password update
      mockedAxios.patch.mockResolvedValueOnce({ data: updatedUser } as any);

      await service.resetPassword(email, newPassword);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `http://localhost:8000/users/${existingUsers[0].id}`,
        { password: newPassword }
      );
    });

    it("throws error when email not found", async () => {
      const email = "nonexistent@test.com";
      const newPassword = "newpassword123";

      // Mock getting users (empty array)
      mockedAxios.get.mockResolvedValueOnce({ data: [] } as any);

      await expect(service.resetPassword(email, newPassword))
        .rejects.toThrow("Email address not found");
    });
  });

  describe("updateUserProfile", () => {
    it("updates user profile successfully", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const updates: UpdateUserPayload = {
        name: "Updated Name",
        company: "Updated Company"
      };

      const updatedUser: User = {
        id: userId,
        email: "test@test.com",
        password: "123456",
        name: "Updated Name",
        role: "planner",
        company: "Updated Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      // Mock email check (for validation)
      mockedAxios.get.mockResolvedValueOnce({ data: [] } as any);
      // Mock user update
      mockedAxios.patch.mockResolvedValueOnce({ data: updatedUser } as any);

      const result = await service.updateUserProfile(userId, updates);
      
      expect(result).toEqual(updatedUser);
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `http://localhost:8000/users/${userId}`,
        updates
      );
    });
  });

  describe("changePassword", () => {
    it("changes password successfully", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const currentPassword = "oldpassword";
      const newPassword = "newpassword123";

      const currentUser: User = {
        id: userId,
        email: "test@test.com",
        password: currentPassword,
        name: "Test User",
        role: "vendor"
      };

      const updatedUser: User = {
        ...currentUser,
        password: newPassword
      };

      // Mock getting current user
      mockedAxios.get.mockResolvedValueOnce({ data: currentUser } as any);
      // Mock password update
      mockedAxios.patch.mockResolvedValueOnce({ data: updatedUser } as any);

      await service.changePassword(userId, currentPassword, newPassword);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `http://localhost:8000/users/${userId}`,
        { password: newPassword }
      );
    });

    it("throws error when current password is incorrect", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const currentPassword = "wrongpassword";
      const newPassword = "newpassword123";

      const currentUser: User = {
        id: userId,
        email: "test@test.com",
        password: "correctpassword",
        name: "Test User",
        role: "vendor"
      };

      // Mock getting current user
      mockedAxios.get.mockResolvedValueOnce({ data: currentUser } as any);

      await expect(service.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow("Current password is incorrect");
    });
  });
});
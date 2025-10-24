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
      const mockUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "test@test.com",
        password: "123456",
        name: "Test User",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      const mockResponse = {
        user: mockUser,
        access: "mock-access-token",
        refresh: "mock-refresh-token"
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse } as any);

      const res = await service.signIn({
        email: "test@test.com",
        password: "123456",
      });

      expect(res).toEqual(mockUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/login/",
        {
          username: "test@test.com",
          password: "123456"
        }
      );
    });

    it("throws error when credentials invalid", async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { detail: "Invalid credentials" }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

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

      const mockResponse = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "vendor@test.com",
        name: "Test Vendor",
        role: "vendor"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "vendor@test.com",
        name: "Test Vendor",
        role: "vendor",
        password: "123456"
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse } as any);

      const result = await service.signUp(signUpData);
      expect(result).toEqual(expectedUser);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/register/",
        {
          username: "vendor@test.com",
          email: "vendor@test.com",
          password: "123456",
          password2: "123456",
          first_name: "Test Vendor",
          role: "vendor"
        }
      );
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

      const mockResponse = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        email: "planner@test.com",
        name: "Test Planner",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        email: "planner@test.com",
        name: "Test Planner",
        role: "planner",
        password: "123456",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse } as any);

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

      const errorResponse = {
        response: {
          status: 400,
          data: {
            username: ["already exists"]
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(service.signUp(signUpData))
        .rejects.toThrow("User with this email already exists");
    });
  });

  describe("requestPasswordReset", () => {
    it("sends password reset email successfully", async () => {
      const email = "test@test.com";

      mockedAxios.post.mockResolvedValueOnce({ data: {} } as any);

      await service.requestPasswordReset(email);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/password-reset/",
        { email: email }
      );
    });

    it("throws error for invalid email", async () => {
      await expect(
        service.requestPasswordReset("invalid-email")
      ).rejects.toThrow("Please enter a valid email address");
    });
  });

  describe("resetPasswordWithToken", () => {
    it("resets password with token successfully", async () => {
      const token = "reset-token-123";
      const newPassword = "newpassword123";
      const confirmPassword = "newpassword123";

      mockedAxios.post.mockResolvedValueOnce({ data: {} } as any);

      await service.resetPasswordWithToken(token, newPassword, confirmPassword);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/password-reset-confirm/",
        {
          token: token,
          password: newPassword,
          password2: confirmPassword
        }
      );
    });

    it("throws error when passwords don't match", async () => {
      await expect(
        service.resetPasswordWithToken("token", "password1", "password2")
      ).rejects.toThrow("Passwords do not match");
    });
  });

  describe("updateUserProfile", () => {
    it("validates email format", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const updates: UpdateUserPayload = {
        email: "invalid-email"
      };

      await expect(service.updateUserProfile(userId, updates))
        .rejects.toThrow("Please enter a valid email address");
    });
  });

  describe("changePassword", () => {
    it("validates password length", async () => {
      const currentPassword = "oldpassword";
      const newPassword = "123"; // Too short

      await expect(service.changePassword(currentPassword, newPassword))
        .rejects.toThrow("New password must be at least 8 characters long");
    });

    it("validates passwords are different", async () => {
      const password = "samepassword";

      await expect(service.changePassword(password, password))
        .rejects.toThrow("New password must be different from current password");
    });
  });
});
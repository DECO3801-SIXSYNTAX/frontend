import axios from "axios";
import { apiLogin, apiCreateUser, apiUpdateUser, apiGetUser, apiCheckEmailExists } from "../api/auth";
import { User, SignUpPayload } from "../services/AuthService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("apiLogin", () => {
    it("returns list of users when API call succeeds", async () => {
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
        { 
          id: "550e8400-e29b-41d4-a716-446655440002", 
          email: "dika@demo.com", 
          password: "abcdef", 
          name: "Dika",
          role: "vendor"
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: fakeUsers } as any);

      const users = await apiLogin({ email: "x", password: "y" });
      expect(users).toEqual(fakeUsers);
      expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:8000/users");
    });

    it("throws error when API call fails", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(apiLogin({ email: "x", password: "y" }))
        .rejects.toThrow("Network error");
    });
  });

  describe("apiCreateUser", () => {
    it("creates new user successfully", async () => {
      const signUpData: SignUpPayload = {
        name: "New User",
        email: "new@test.com",
        password: "password123",
        role: "planner",
        company: "New Company",
        phone: "+1111111111",
        experience: "3-5 years",
        specialty: "Weddings"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440003",
        ...signUpData
      };

      mockedAxios.post.mockResolvedValueOnce({ data: expectedUser } as any);

      const result = await apiCreateUser(signUpData);
      
      expect(result).toEqual(expectedUser);
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:8000/users",
        expect.objectContaining({
          ...signUpData,
          id: expect.any(String)
        })
      );
    });

    it("creates vendor without planner fields", async () => {
      const signUpData: SignUpPayload = {
        name: "Vendor User",
        email: "vendor@test.com",
        password: "password123",
        role: "vendor"
      };

      const expectedUser: User = {
        id: "550e8400-e29b-41d4-a716-446655440004",
        ...signUpData
      };

      mockedAxios.post.mockResolvedValueOnce({ data: expectedUser } as any);

      const result = await apiCreateUser(signUpData);
      
      expect(result).toEqual(expectedUser);
      expect(result.role).toBe("vendor");
      expect(result.company).toBeUndefined();
    });
  });

  describe("apiUpdateUser", () => {
    it("updates user successfully", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const updateData = { password: "newpassword123" };
      const updatedUser: User = {
        id: userId,
        email: "test@test.com",
        password: "newpassword123",
        name: "Test User",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      mockedAxios.patch.mockResolvedValueOnce({ data: updatedUser } as any);

      const result = await apiUpdateUser(userId, updateData);
      
      expect(result).toEqual(updatedUser);
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `http://localhost:8000/users/${userId}`,
        updateData
      );
    });
  });

  describe("apiGetUser", () => {
    it("gets user by ID successfully", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440001";
      const user: User = {
        id: userId,
        email: "test@test.com",
        password: "123456",
        name: "Test User",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "5+ years",
        specialty: "Corporate Events"
      };

      mockedAxios.get.mockResolvedValueOnce({ data: user } as any);

      const result = await apiGetUser(userId);
      
      expect(result).toEqual(user);
      expect(mockedAxios.get).toHaveBeenCalledWith(`http://localhost:8000/users/${userId}`);
    });
  });

  describe("apiCheckEmailExists", () => {
    it("returns true when email exists", async () => {
      const users: User[] = [
        { 
          id: "550e8400-e29b-41d4-a716-446655440001", 
          email: "existing@test.com", 
          password: "123456", 
          name: "Existing User",
          role: "vendor"
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: users } as any);

      const result = await apiCheckEmailExists("existing@test.com");
      
      expect(result).toBe(true);
    });

    it("returns false when email does not exist", async () => {
      const users: User[] = [];

      mockedAxios.get.mockResolvedValueOnce({ data: users } as any);

      const result = await apiCheckEmailExists("nonexistent@test.com");
      
      expect(result).toBe(false);
    });
  });
});
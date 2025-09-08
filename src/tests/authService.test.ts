import axios from "axios";
import { AuthService, User } from "../services/AuthService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("AuthService", () => {
  const service = new AuthService();

  it("throws error if email/password missing", async () => {
    await expect(
      service.signIn({ email: "", password: "" })
    ).rejects.toThrow("Email and password are required");
  });

  it("returns user data when login success", async () => {
    const fakeUsers: User[] = [
      { id: 1, email: "test@test.com", password: "123456", name: "Test User" },
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
      { id: 1, email: "test@test.com", password: "123456", name: "Test User" },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: fakeUsers } as any);

    await expect(
      service.signIn({ email: "wrong@test.com", password: "wrongpass" })
    ).rejects.toThrow("Invalid credentials");
  });
});
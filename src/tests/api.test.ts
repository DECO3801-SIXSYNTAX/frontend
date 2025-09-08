import axios from "axios";
import { apiLogin } from "../api/auth";
import { User } from "../services/AuthService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("apiLogin", () => {
  it("returns list of users when API call succeeds", async () => {
    const fakeUsers: User[] = [
      { id: 1, email: "test@test.com", password: "123456", name: "Test User" },
      { id: 2, email: "dika@demo.com", password: "abcdef", name: "Dika Pratama" },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: fakeUsers } as any);

    const users = await apiLogin({ email: "x", password: "y" });
    expect(users).toEqual(fakeUsers);
  });

  it("throws error when API call fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

    await expect(apiLogin({ email: "x", password: "y" }))
      .rejects.toThrow("Network error");
  });
});
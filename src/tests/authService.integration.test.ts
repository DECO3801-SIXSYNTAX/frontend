import { AuthService, User } from "../services/AuthService";

describe("AuthService Integration with json-server", () => {
  const service = new AuthService();

  it("success login with existing user from db.json", async () => {
    const user = await service.signIn({
      email: "test@test.com",
      password: "123456",
    });

    expect(user).toMatchObject<User>({
      id: expect.any(Number),
      email: "test@test.com",
      password: "123456",
    });
  });

  it("throws error for wrong credentials", async () => {
    await expect(
      service.signIn({
        email: "wrong@test.com",
        password: "wrongpass",
      })
    ).rejects.toThrow("Invalid credentials");
  });
});

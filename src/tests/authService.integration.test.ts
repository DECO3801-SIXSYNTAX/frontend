import { AuthService, User, SignUpPayload } from "../services/AuthService";

describe("AuthService Integration with json-server", () => {
  const service = new AuthService();

  describe("signIn", () => {
    it("success login with existing user from db.json", async () => {
      const user = await service.signIn({
        email: "test@test.com",
        password: "123456",
      });

      expect(user).toMatchObject<Partial<User>>({
        id: expect.any(String),
        email: "test@test.com",
        password: "123456",
        name: expect.any(String),
        role: expect.any(String),
      });

      // Verify UUID format
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
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

  describe("signUp", () => {
    it("creates new vendor successfully", async () => {
      const signUpData: SignUpPayload = {
        name: "Integration Test Vendor",
        email: `vendor-${Date.now()}@test.com`,
        password: "123456",
        role: "vendor"
      };

      const user = await service.signUp(signUpData);

      expect(user).toMatchObject<Partial<User>>({
        id: expect.any(String),
        email: signUpData.email,
        name: signUpData.name,
        role: "vendor"
      });

      // Verify UUID format
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("creates new planner successfully", async () => {
      const signUpData: SignUpPayload = {
        name: "Integration Test Planner",
        email: `planner-${Date.now()}@test.com`,
        password: "123456",
        role: "planner",
        company: "Test Company",
        phone: "+1234567890",
        experience: "3-5 years",
        specialty: "Corporate Events"
      };

      const user = await service.signUp(signUpData);

      expect(user).toMatchObject<Partial<User>>({
        id: expect.any(String),
        email: signUpData.email,
        name: signUpData.name,
        role: "planner",
        company: "Test Company"
      });

      // Verify UUID format
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("throws error for duplicate email", async () => {
      const signUpData: SignUpPayload = {
        name: "Duplicate Test",
        email: "test@test.com", // This email already exists in db.json
        password: "123456",
        role: "vendor"
      };

      await expect(service.signUp(signUpData))
        .rejects.toThrow("User with this email already exists");
    });
  });

  describe("resetPassword", () => {
    it("resets password for existing user", async () => {
      const email = "dika@demo.com";
      const newPassword = "newpassword123";

      await service.resetPassword(email, newPassword);

      // Verify password was changed by trying to login
      const user = await service.signIn({
        email: email,
        password: newPassword
      });

      expect(user.email).toBe(email);
    }, 10000); // Increase timeout for integration test
  });

  describe("getUserProfile", () => {
    it("gets user profile successfully", async () => {
      // First sign in to get a user ID
      const signedInUser = await service.signIn({
        email: "test@test.com",
        password: "123456"
      });

      const profile = await service.getUserProfile(signedInUser.id);

      expect(profile).toMatchObject({
        id: signedInUser.id,
        email: "test@test.com",
        name: expect.any(String),
        role: expect.any(String)
      });
    });
  });
});
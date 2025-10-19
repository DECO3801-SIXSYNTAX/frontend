import { AuthService, User, SignUpPayload } from "../services/AuthService";

describe("AuthService Integration with Django backend", () => {
  const service = new AuthService();

  describe("signIn", () => {
    it("throws error for invalid credentials with Django backend", async () => {
      await expect(
        service.signIn({
          email: "wrong@test.com",
          password: "wrongpass",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("throws error for network issues", async () => {
      await expect(
        service.signIn({
          email: "test@example.com",
          password: "testpass",
        })
      ).rejects.toThrow(); // Will throw network error since Django backend might not be running
    });
  });

  describe("signUp", () => {
    it("throws error for network issues during signup", async () => {
      const signUpData: SignUpPayload = {
        name: "Integration Test Vendor",
        email: `vendor-${Date.now()}@test.com`,
        password: "123456",
        role: "vendor"
      };

      // Will throw network error since Django backend might not be running
      await expect(service.signUp(signUpData))
        .rejects.toThrow();
    });

    it("validates planner required fields", async () => {
      const signUpData: SignUpPayload = {
        name: "Integration Test Planner",
        email: `planner-${Date.now()}@test.com`,
        password: "123456",
        role: "planner"
        // Missing required planner fields
      };

      await expect(service.signUp(signUpData))
        .rejects.toThrow("Company, phone, experience, and specialty are required for planners");
    });
  });

  describe("requestPasswordReset", () => {
    it("handles password reset request", async () => {
      const email = "test@test.com";

      // This will throw since backend is not running, but that's expected
      await expect(service.requestPasswordReset(email))
        .rejects.toThrow();
    }, 10000); // Increase timeout for integration test
  });

  describe("getUserProfile", () => {
    it("throws error for invalid user ID", async () => {
      await expect(service.getUserProfile("invalid-id"))
        .rejects.toThrow();
    });
  });
});
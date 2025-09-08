import { apiLogin } from "../api/auth";
import { Logger } from "../utils/logger";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
  name: string; 
}

export class AuthService {
  async signIn(data: LoginPayload): Promise<User> {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }

    try {
      // 🔎 Ambil list users dari fake API
      const users = await apiLogin(data);

      // ✅ Cari user sesuai email & password
      const user = users.find(
        (u) => u.email === data.email && u.password === data.password
      );

      if (!user) {
        Logger.warn("Invalid login attempt", data.email);
        throw new Error("Invalid credentials");
      }

      Logger.info("User logged in successfully", user);
      return user;
    } catch (err: any) {
      if (err.message === "Invalid credentials") {
        throw err; // biarin tetap Invalid credentials
      }

      Logger.error("Login failed due to network/backend error", err);
      throw new Error(err.response?.data?.detail || "Login failed");
    }
  }
}

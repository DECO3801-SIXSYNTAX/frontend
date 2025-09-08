import axios from "axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
}

export class AuthService {
  async signIn(data: LoginPayload): Promise<User> {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }

    const API_URL =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

    try {
      const res = await axios.get<User[]>(`${API_URL}/users`);
      const user = res.data.find(
        (u) => u.email === data.email && u.password === data.password
      );

      if (!user) throw new Error("Invalid credentials");
      return user;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || "Login failed");
    }
  }
}

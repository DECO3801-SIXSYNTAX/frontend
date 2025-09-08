import axios from "axios";
import { LoginPayload, User } from "../services/AuthService";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export async function apiLogin(data: LoginPayload): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/users`);
  return res.data;
}

export async function apiUpdateUser(userId: number, userData: User): Promise<User> {
  // Make sure the URL is constructed correctly
  const url = `${API_URL}/users/${userId}`;
  console.log('Update URL:', url); // Debug log
  
  const res = await axios.put<User>(url, userData);
  return res.data;
}
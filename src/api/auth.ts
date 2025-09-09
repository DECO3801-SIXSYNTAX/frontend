import axios from "axios";
import { LoginPayload, User, SignUpPayload } from "../services/AuthService";

const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

// Function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function apiLogin(data: LoginPayload): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/users`);
  return res.data;
}

export async function apiUpdateUser(userId: string, userData: Partial<User>): Promise<User> {
  const url = `${API_URL}/users/${userId}`;
  console.log('Update URL:', url);
  
  // Use PATCH to update only specific fields
  const res = await axios.patch<User>(url, userData);
  return res.data;
}

export async function apiCreateUser(userData: SignUpPayload): Promise<User> {
  // Generate UUID for new user
  const newUserData: User = {
    ...userData,
    id: generateUUID()
  };
  
  console.log('Creating user with data:', newUserData);
  
  const res = await axios.post<User>(`${API_URL}/users`, newUserData);
  return res.data;
}

export async function apiGetUser(userId: string): Promise<User> {
  const res = await axios.get<User>(`${API_URL}/users/${userId}`);
  return res.data;
}

export async function apiCheckEmailExists(email: string): Promise<boolean> {
  try {
    const users = await apiLogin({ email: "", password: "" });
    return users.some(user => user.email === email);
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

export async function apiDeleteUser(userId: string): Promise<void> {
  await axios.delete(`${API_URL}/users/${userId}`);
}

export async function apiGetAllUsers(): Promise<User[]> {
  const res = await axios.get<User[]>(`${API_URL}/users`);
  return res.data;
}
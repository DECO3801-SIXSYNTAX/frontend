import type { EventItem, UserItem, GuestItem } from "@/types";
import { getAuthToken } from "@/lib/auth";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

function withAuth(init?: RequestInit): RequestInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { ...init, headers };
}

export const api = {
  // Events
  listEvents: (): Promise<EventItem[]> =>
    fetch(`${API_BASE}/events/`, withAuth()).then((res) => handle<EventItem[]>(res)),
  getEvent: (slug: string): Promise<EventItem> =>
    fetch(`${API_BASE}/events/${slug}/`, withAuth()).then((res) => handle<EventItem>(res)),
  listEventGuests: (slug: string): Promise<GuestItem[]> =>
    fetch(`${API_BASE}/events/${slug}/guests/`, withAuth()).then((res) => handle<GuestItem[]>(res)),

  // Users
  listUsers: (): Promise<UserItem[]> =>
    fetch(`${API_BASE}/users/`, withAuth()).then((res) => handle<UserItem[]>(res)),
  inviteUser: (payload: { name: string; email: string; role: string }): Promise<UserItem> =>
    fetch(`${API_BASE}/users/`, withAuth({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })).then((res) => handle<UserItem>(res)),
  updateUser: (id: number, patch: Partial<Omit<UserItem, 'id'>>): Promise<UserItem> =>
    fetch(`${API_BASE}/users/${id}/`, withAuth({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })).then((res) => handle<UserItem>(res)),
};

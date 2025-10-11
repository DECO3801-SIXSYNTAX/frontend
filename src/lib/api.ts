import type { EventItem, UserItem, GuestItem } from "@/types";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Events
  listEvents: (): Promise<EventItem[]> =>
    fetch(`${API_BASE}/events/`).then((res) => handle<EventItem[]>(res)),
  getEvent: (slug: string): Promise<EventItem> =>
    fetch(`${API_BASE}/events/${slug}/`).then((res) => handle<EventItem>(res)),
  listEventGuests: (slug: string): Promise<GuestItem[]> =>
    fetch(`${API_BASE}/events/${slug}/guests/`).then((res) => handle<GuestItem[]>(res)),

  // Users
  listUsers: (): Promise<UserItem[]> =>
    fetch(`${API_BASE}/users/`).then((res) => handle<UserItem[]>(res)),
  inviteUser: (payload: { name: string; email: string; role: string }): Promise<UserItem> =>
    fetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((res) => handle<UserItem>(res)),
  updateUser: (id: number, patch: Partial<Omit<UserItem, 'id'>>): Promise<UserItem> =>
    fetch(`${API_BASE}/users/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then((res) => handle<UserItem>(res)),
};

import type { EventItem, UserItem, GuestItem } from "@/types";
import { getAuthToken, getRefreshToken, setAuthToken, AUTH_REFRESH_PATH } from "@/lib/auth";

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

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const url = (() => {
      if (AUTH_REFRESH_PATH.startsWith('http')) return AUTH_REFRESH_PATH;
      const base = new URL(API_BASE);
      if (AUTH_REFRESH_PATH.startsWith('/')) return `${base.origin}${AUTH_REFRESH_PATH}`;
      return `${API_BASE.replace(/\/$/, '/')}${AUTH_REFRESH_PATH}`;
    })();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess = data.access as string | undefined;
    if (newAccess) setAuthToken(newAccess);
    return newAccess ?? null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let res = await fetch(input, withAuth(init));
  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await fetch(input, withAuth(init));
    }
  }
  return handle<T>(res);
}

export const api = {
  // Events
  listEvents: (): Promise<EventItem[]> =>
    // Backend mounts events app at /api/events/, router registers 'events' => /api/events/events/
    fetchJson<EventItem[]>(`${API_BASE}/events/events/`),
  getEvent: (id: string): Promise<EventItem> =>
    fetchJson<EventItem>(`${API_BASE}/events/events/${id}/`),
  listEventGuests: (_eventId: string): Promise<GuestItem[]> =>
    // GuestViewSet is at /api/events/guests/ (no per-event filter in API yet)
    fetchJson<GuestItem[]>(`${API_BASE}/events/guests/`),

  // Users
  listUsers: (): Promise<UserItem[]> =>
    fetchJson<UserItem[]>(`${API_BASE}/users/`),
  inviteUser: (payload: { name: string; email: string; role: string }): Promise<UserItem> =>
    fetchJson<UserItem>(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateUser: (id: number, patch: Partial<Omit<UserItem, 'id'>>): Promise<UserItem> =>
    fetchJson<UserItem>(`${API_BASE}/users/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
};

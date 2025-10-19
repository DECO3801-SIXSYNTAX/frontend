import type { EventItem, UserItem, GuestItem, EventStatus } from "@/types";
import { getAuthToken, getRefreshToken, setAuthToken, AUTH_REFRESH_PATH, isAdmin } from "@/lib/auth";

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

async function fetchMaybe<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data?: T; errorText?: string; }> {
  let res = await fetch(url, withAuth(init));
  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) res = await fetch(url, withAuth(init));
  }
  const status = res.status;
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    return { ok: false, status, errorText };
  }
  const data = await res.json().catch(() => undefined);
  return { ok: true, status, data } as any;
}

export const api = {
  // Helpers
  _normalizeEvent(row: any): EventItem {
    const raw = row || {};
    const id = String(raw.id ?? raw.pk ?? raw.uuid ?? "");
    const name = String(raw.name ?? raw.title ?? "Untitled");
    const date = String(raw.date ?? raw.startDate ?? raw.endDate ?? raw.updatedAt ?? raw.createdAt ?? "");
    const venue = String(raw.venue ?? raw.location ?? "");
    // Normalize status across sources: admin(Firestore): planning/active/draft; django: DRAFT/PUBLISHED
    let s = String(raw.status ?? "").toLowerCase();
    let status: EventStatus = "Draft";
    if (s === "planning") status = "Planning";
    else if (s === "active") status = "Active";
    else if (s === "archived") status = "Archived";
    else if (s === "published") status = "Active"; // map Published -> Active for dashboard buckets
    else if (s === "draft" || s === "") status = "Draft";
    // Django choices may be uppercase
    if (s === "draft") status = "Draft";
    if (s === "published") status = "Active";
    if (s === "draft" || s === "published") {
      // already handled
    }
    if (raw.status === "DRAFT") status = "Draft";
    if (raw.status === "PUBLISHED") status = "Active";

    const owner = String(raw.owner ?? raw.createdBy ?? "");
    return { id, slug: String(raw.slug ?? id), name, date, venue, status, owner };
  },
  // Events
  listEvents: async (): Promise<EventItem[]> => {
    // Try admin endpoint first; if 403, fall back to events endpoint.
    const adminUrl = `${API_BASE}/admin/events/`;
    const evUrl = `${API_BASE}/events/events/`;
    const a = await fetchMaybe<any[]>(adminUrl);
    if (a.ok) return (a.data || []).map(api._normalizeEvent);
    if (a.status !== 403) throw new Error(a.errorText || `HTTP ${a.status}`);
    const e = await fetchMaybe<any[]>(evUrl);
    if (e.ok) return (e.data || []).map(api._normalizeEvent);
    if (e.status === 403) throw new Error('Forbidden: your account lacks permission to view events. Ask an admin to grant access.');
    throw new Error(e.errorText || `HTTP ${e.status}`);
  },
  getEvent: async (id: string): Promise<EventItem> => {
    // Decide by ID shape: UUID -> Django detail; otherwise assume Firestore admin list
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));
    if (!isUuid) {
      const rows = await fetchJson<any[]>(`${API_BASE}/admin/events/`);
      const found = rows.find(r => String(r.id) === String(id));
      if (!found) throw new Error('Not found');
      return api._normalizeEvent(found);
    }
    const row = await fetchJson<any>(`${API_BASE}/events/events/${id}/`);
    return api._normalizeEvent(row);
  },
  listEventGuests: (_eventId: string): Promise<GuestItem[]> =>
    // GuestViewSet is at /api/events/guests/ (no per-event filter in API yet)
    fetchJson<GuestItem[]>(`${API_BASE}/events/guests/`),

  // Activity
  listRecentActivity: async (opts?: { eventId?: string; limit?: number }): Promise<string[]> => {
    const url = new URL(`${API_BASE}/admin/activity/`);
    if (opts?.eventId) url.searchParams.set('eventId', opts.eventId);
    if (opts?.limit) url.searchParams.set('limit', String(opts.limit));
    const raw = await fetchJson<any>(url.toString());
    const arr: Array<{ summary?: string; action: string; entityType: string; entityId: string; actorEmail?: string; ts?: string; }>
      = Array.isArray(raw) ? raw : (raw?.items || []);
    return arr.map(i => i.summary || `${i.actorEmail || 'someone'} performed ${i.action} on ${i.entityType} ${i.entityId}`);
  },

  // Users
  listUsers: (): Promise<UserItem[]> =>
    fetchJson<UserItem[]>(`${API_BASE}/admin/users/`),
  inviteUser: (payload: { name: string; email: string; role: string }): Promise<UserItem> =>
    fetchJson<UserItem>(`${API_BASE}/admin/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, patch: Partial<Omit<UserItem, 'id'>>): Promise<UserItem> =>
  fetchJson<UserItem>(`${API_BASE}/admin/users/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
};

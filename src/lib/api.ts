import type { EventItem, UserItem, GuestItem, EventStatus, UserRole, UserStatus } from "@/types";
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
  // Use Django JWT refresh token
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
    // Normalize status across sources: admin(Firestore): planning/active/draft; django: DRAFT/PUBLISHED
    const rawStatus = String(raw.status ?? raw.state ?? "").trim().toLowerCase();
    const statusMap: Record<string, EventStatus> = {
      draft: "Draft", planning: "Planning", active: "Active",
      published: "Active", done: "Active", archived: "Archived"
    };
    const status: EventStatus = statusMap[rawStatus] || "Draft";
    return {
      id, slug: String(raw.slug ?? id), name, date,
      venue: String(raw.venue ?? raw.venueName ?? raw.location ?? ""),
      status, owner: String(raw.owner ?? raw.createdBy ?? "")
    };
  },

  _normalizeUser(raw: any): UserItem {
    const id = String(raw.id ?? raw.pk ?? raw.uuid ?? "");
    const name = String(raw.name ?? raw.first_name ?? raw.username ?? "Unknown");
    const email = String(raw.email ?? "");
    
    // Normalize role: backend uses lowercase, frontend uses PascalCase
    const rawRole = String(raw.role ?? "guest").trim().toLowerCase();
    const roleMap: Record<string, UserRole> = {
      admin: "Admin",
      planner: "Planner",
      vendor: "Vendor",
      guest: "Guest"
    };
    const role: UserRole = roleMap[rawRole] || "Guest";
    
    // Normalize status: backend uses boolean is_active, frontend uses string
    const isActive = typeof raw.status === 'boolean' ? raw.status : (raw.is_active ?? true);
    const status: UserStatus = isActive ? "Active" : "Suspended";
    
    const lastActive = raw.lastActive ?? raw.last_login ?? raw.last_active ?? null;
    
    return { id, name, email, role, status, lastActive };
  },
  // Events
  listEvents: async (): Promise<EventItem[]> => {
    // Try admin endpoint first (for admin users)
    const adminUrl = `${API_BASE}/admin/events/`;
    const a = await fetchMaybe<any[]>(adminUrl);
    if (a.ok) return (a.data || []).map(api._normalizeEvent);
    
    // If not admin (403), try event endpoint (for planners/vendors)
    if (a.status === 403) {
      const evUrl = `${API_BASE}/event/events/`;
      const e = await fetchMaybe<any[]>(evUrl);
      if (e.ok) return (e.data || []).map(api._normalizeEvent);
      if (e.status === 403) throw new Error('Forbidden: your account lacks permission to view events. Ask an admin to grant access.');
      throw new Error(e.errorText || `HTTP ${e.status}`);
    }
    
    throw new Error(a.errorText || `HTTP ${a.status}`);
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
  listUsers: async (): Promise<UserItem[]> => {
    const raw = await fetchJson<any[]>(`${API_BASE}/admin/users/`);
    return raw.map(u => api._normalizeUser(u));
  },
  inviteUser: async (payload: { name: string; email: string; role: string }): Promise<UserItem> => {
    // Convert frontend PascalCase role to backend lowercase
    const backendPayload = {
      ...payload,
      role: payload.role.toLowerCase(),
      first_name: payload.name
    };
    const raw = await fetchJson<any>(`${API_BASE}/admin/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    });
    return api._normalizeUser(raw);
  },
  updateUser: async (id: string, patch: Partial<Omit<UserItem, 'id'>>): Promise<UserItem> => {
    // Convert frontend format to backend format
    const backendPatch: any = {};
    
    if (patch.name !== undefined) {
      backendPatch.first_name = patch.name;
    }
    if (patch.role !== undefined) {
      backendPatch.role = patch.role.toLowerCase();
    }
    if (patch.status !== undefined) {
      backendPatch.is_active = patch.status === "Active";
    }
    if (patch.email !== undefined) {
      backendPatch.email = patch.email;
    }
    
    const raw = await fetchJson<any>(`${API_BASE}/admin/users/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPatch),
    });
    return api._normalizeUser(raw);
  },
};

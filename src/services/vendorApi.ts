import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

// -------- Types matching Backend Serializers --------
export type VendorEventCard = {
  id: string;
  name: string;
  date: string | null; // from startDate
  venue?: string | null;
  status: string;
  attendees: number; // from expectedAttendees
  capacity: number;
};

export type FirestoreEvent = {
  id: string; 
  name: string;
  address?: string; 
  venue?: string; 
  description?: string;
  startDate?: string; 
  endDate?: string;
  expectedAttendees?: number; 
  actualAttendees?: number;
  capacity?: number; 
  status?: string;
  tags?: string[]; 
  type?: string; 
  budget?: number;
  collaborators?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

// This matches the Firestore structure from the elements collection
export type LayoutElement = {
  id: string;
  type: string;
  name?: string;
  capacity: number;
  geom: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    radius?: number;
    color?: string;
    meta?: {
      configId?: string;
      shape?: string;
      label?: string;
      textColor?: string;
      defaultWidth?: number;
      defaultHeight?: number;
      defaultRadius?: number;
      description?: string;
    };
  };
  assigned_guest_ids: string[];  // Note: underscore in Firestore
  updatedAt?: string;
};

// This is what the FE expects (flattened structure)
export type FELayoutElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  name?: string;
  assignedGuests: string[];
  config?: {
    id?: string;
    shape?: string;
    label?: string;
    color?: string;
    textColor?: string;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultRadius?: number;
    description?: string;
  };
  radius?: number;
};

export type VendorLayout = {
  id: string;
  eventId: string;
  canvasSize: { width: number; height: number };
  pixelsPerMeter: number;
  elements: FELayoutElement[];  // Use FE format
  roomBoundary?: { vertices?: any[]; closed?: boolean } | null;
  version: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Guest = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  seatId?: string | null;
  seatName?: string | null;
  seatType?: string | null;
  dietaryRestriction?: string;
  accessibilityNeeds?: string;
  checkedIn?: boolean;
};

type ListEventsResp = { items: VendorEventCard[] };
type GuestsResp = { items: Guest[]; nextPageToken?: string | null };

// Helper function to transform backend layout to FE format
function transformLayoutForFE(backendLayout: any): VendorLayout {
  const canvasRaw = backendLayout.canvas || {};
  const canvas = {
    width: canvasRaw.width ?? canvasRaw.canvasSize?.width ?? 1200,
    height: canvasRaw.height ?? canvasRaw.canvasSize?.height ?? 800,
    px_per_m: canvasRaw.px_per_m ?? backendLayout.pixelsPerMeter ?? 50,
    roomBoundary: canvasRaw.roomBoundary ?? null,
    floorplan_id: canvasRaw.floorplan_id || backendLayout.id,
  };

  const feElements: FELayoutElement[] = (backendLayout.elements || []).map((el: any) => {
    // Support both shapes:
    // A) { geom: {...}, assigned_guest_ids: [] }
    // B) flat fields + config + assignedGuests
    const geom = el.geom || {
      x: el.x, y: el.y, width: el.width, height: el.height,
      rotation: el.rotation, radius: el.radius, color: el.color,
      meta: {
        configId: el.config?.id,
        shape: el.config?.shape,
        label: el.config?.label,
        textColor: el.config?.textColor,
        defaultWidth: el.config?.defaultWidth,
        defaultHeight: el.config?.defaultHeight,
        defaultRadius: el.config?.defaultRadius,
        description: el.config?.description,
      }
    };

    const assigned = el.assigned_guest_ids || el.assignedGuests || [];

    return {
      id: el.id,
      type: el.type,
      x: geom?.x ?? 0,
      y: geom?.y ?? 0,
      width: geom?.width ?? (geom?.radius ? geom.radius * 2 : 100),
      height: geom?.height ?? (geom?.radius ? geom.radius * 2 : 60),
      rotation: geom?.rotation ?? 0,
      capacity: el.capacity ?? 0,
      name: el.name,
      assignedGuests: assigned,
      config: {
        id: geom?.meta?.configId || el.config?.id || el.type,
        shape: geom?.meta?.shape || el.config?.shape || 'rounded-rect',
        label: geom?.meta?.label || el.config?.label || el.type,
        color: geom?.color || el.config?.color || '#8B5CF6',
        textColor: geom?.meta?.textColor || el.config?.textColor || '#FFFFFF',
        defaultWidth: geom?.meta?.defaultWidth || el.config?.defaultWidth || geom?.width,
        defaultHeight: geom?.meta?.defaultHeight || el.config?.defaultHeight || geom?.height,
        defaultRadius: geom?.meta?.defaultRadius || el.config?.defaultRadius,
        description: geom?.meta?.description || el.config?.description || '',
      },
      radius: geom?.radius,
    };
  });

  return {
    id: canvas.floorplan_id || backendLayout.id || `fp-${backendLayout.eventId}`,
    eventId: backendLayout.eventId || backendLayout.event_id,
    canvasSize: { width: canvas.width, height: canvas.height },
    pixelsPerMeter: canvas.px_per_m ?? 50,
    elements: feElements,
    roomBoundary: canvas.roomBoundary || null,
    version: backendLayout.version || 1,
    createdAt: backendLayout.createdAt,
    updatedAt: backendLayout.updatedAt,
  };
}


export async function listVendorEvents(): Promise<VendorEventCard[]> {
  const { data } = await API.get<ListEventsResp>("/api/vendor/events", { headers: auth() });
  return data.items;
}

export async function getVendorEvent(eventId: string): Promise<FirestoreEvent> {
  const { data } = await API.get<FirestoreEvent>(`/api/vendor/events/${eventId}`, { headers: auth() });
  return data;
}

export async function getVendorLayout(eventId: string): Promise<VendorLayout> {
  const { data } = await API.get(`/api/vendor/events/${eventId}/layout`, { headers: auth() });
  return transformLayoutForFE(data);
}

export async function getVendorGuests(
  eventId: string,
  params?: { q?: string; tags?: string[]; limit?: number; pageToken?: string }
): Promise<GuestsResp> {
  // Backend endpoint: /api/vendor/events/:eventId/guests
  try {
    const { data } = await API.get<GuestsResp>(
      `/api/vendor/events/${eventId}/guests`,
      { params, headers: auth() }
    );
    // normalize: some backends may return array instead of {items}
    if (Array.isArray(data as any)) {
      return { items: data as any, nextPageToken: null };
    }
    return data ?? { items: [], nextPageToken: null };
  } catch (err: any) {
    console.warn("getVendorGuests failed:", err?.response?.status || err);
    return { items: [], nextPageToken: null };
  }
}

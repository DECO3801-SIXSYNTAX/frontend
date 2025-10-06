// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'Admin' | 'Planner' | 'Vendor' | 'Guest';
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}

// Event Types
export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  venue: string;
  status: 'Draft' | 'Planning' | 'Active' | 'Archived';
  owner: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: User['role'];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: User['role'];
  is_active?: boolean;
}

// Guest Management Types (TODO: Move to API when implemented)
export type RSVPStatus = "Pending" | "Accepted" | "Declined";
export type DietaryTag = "Vegetarian" | "Vegan" | "Halal" | "Kosher" | "Gluten-free" | "Nut allergy";
export type AccessTag = "Wheelchair" | "Low-vision" | "Hearing";

export interface GuestItem {
  id: string;
  name: string;
  email: string;
  group?: string;          // e.g., "VIP", "Company A", "Family"
  dietary?: DietaryTag[];
  access?: AccessTag[];
  rsvp: RSVPStatus;
  seat?: string;           // e.g., "T3-S12" (edit on Seating page)
  checkedIn: boolean;
}

// Event types
export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  status: EventStatus;
  attendees: number;
  description: string;
  createdBy: string;
}

export type EventStatus = 'draft' | 'published' | 'completed' | 'active';

// User types
export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'planner' | 'vendor';
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}

// API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

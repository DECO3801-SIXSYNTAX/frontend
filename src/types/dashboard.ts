export interface Event {
  id: string;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  capacity: number;
  expectedAttendees: number;
  actualAttendees: number;
  budget: number;
  dietaryNeeds: number;
  accessibilityNeeds: number;
  status: 'draft' | 'planning' | 'active' | 'confirmed' | 'done';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  notes: string;
}

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  dietaryRestrictions: string;
  accessibilityNeeds: string;
  rsvpStatus: 'pending' | 'confirmed' | 'declined';
  importedAt: string;
  // Seat assignment properties (set when guest is assigned to a seat in layout editor)
  seatId?: string;
  tableId?: string;
  seatNumber?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  invitedBy: string;
  status: 'online' | 'away' | 'offline';
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  eventId: string | null;
  timestamp: string;
  type: 'event' | 'guest' | 'team';
}

export interface Invitation {
  id: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  used: boolean;
  usedBy: string | null;
  usedAt: string | null;
}

export interface EventStatistics {
  totalGuests: number;
  assignedSeats: number;
  dietaryNeeds: number;
  accessibilityNeeds: number;
  completionRate: number;
}

export interface CreateEventForm {
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  capacity: number;
  expectedAttendees: number;
  budget: number;
  dietaryNeeds: number;
  accessibilityNeeds: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  notes: string;
}

export interface CreateEventFormErrors {
  name?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  address?: string;
  capacity?: string;
  expectedAttendees?: string;
  budget?: string;
  dietaryNeeds?: string;
  accessibilityNeeds?: string;
  tags?: string;
  priority?: string;
  notes?: string;
}

export type CurrentPage =
  | 'signin'
  | 'dashboard'
  | 'events-list'
  | 'activity-log'
  | 'app-settings'
  | 'event-settings'
  | 'layout-editor'
  | string; // Allow dynamic event config pages like 'event-config-{eventId}' or 'layout-editor-{eventId}'

export interface DashboardContextType {
  currentPage: CurrentPage;
  setCurrentPage: (page: CurrentPage) => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  guests: Guest[];
  setGuests: (guests: Guest[]) => void;
  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  refreshData: () => void;
}
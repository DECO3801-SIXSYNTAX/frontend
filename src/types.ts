export type EventStatus = "Active" | "Planning" | "Draft" | "Archived";
export interface EventItem {
  id: string;
  name: string;
  date: string;   // ISO
  venue: string;
  status: EventStatus;
  owner: string;
}

export type UserRole = "Admin" | "Planner" | "Vendor" | "Guest";
export type UserStatus = "Active" | "Suspended";

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
}

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

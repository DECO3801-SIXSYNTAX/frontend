import { EventItem, UserItem } from "./types";

export const events: EventItem[] = [
  { id: "tech-2024", name: "Tech Conference 2024", date: "2025-03-15", venue: "Convention Center", status: "Active", owner: "Planner Team A" },
  { id: "grad-2025", name: "Annual Graduation", date: "2025-04-22", venue: "University Hall", status: "Planning", owner: "Planner Team B" },
  { id: "gala-2025", name: "Corporate Gala Dinner", date: "2025-05-08", venue: "Grand Ballroom", status: "Draft", owner: "Planner Team C" },
];

export const users: UserItem[] = [
  { id: 1, name: "Mike Chen", email: "mike@sipanit.app", role: "Planner", status: "Active", lastActive: "2m ago" },
  { id: 2, name: "Lisa Rodriguez", email: "lisa@sipanit.app", role: "Vendor", status: "Active", lastActive: "1h ago" },
  { id: 3, name: "David Park", email: "david@sipanit.app", role: "Planner", status: "Active", lastActive: "3h ago" },
  { id: 4, name: "Emma Thompson", email: "emma@sipanit.app", role: "Guest", status: "Suspended", lastActive: "1d ago" },
];

import type { GuestItem } from "./types";

export const guestsByEvent: Record<string, GuestItem[]> = {
  "tech-2024": [
    { id: "g1", name: "Ava Li",    email: "ava@example.com",    group: "VIP", dietary: ["Vegetarian"], access: ["Wheelchair"], rsvp: "Accepted", seat: "A2-05", checkedIn: false },
    { id: "g2", name: "Ben Novak", email: "ben@example.com",    group: "Speakers", dietary: ["Gluten-free"], rsvp: "Pending", seat: "SP-03", checkedIn: false },
    { id: "g3", name: "Chloe Yu",  email: "chloe@example.com",  group: "Company A", rsvp: "Accepted", seat: "B1-11", checkedIn: true },
    { id: "g4", name: "Dylan Ho",  email: "dylan@example.com",  group: "Company B", dietary: ["Vegan","Nut allergy"], rsvp: "Accepted", checkedIn: false },
  ],
};



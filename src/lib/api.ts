// Mock API functions for admin pages
export const api = {
  // Events
  listEvents: async () => {
    // Mock data
    return [
      {
        id: '1',
        name: 'Tech Conference 2024',
        date: '2024-12-15',
        location: 'Convention Center',
        status: 'published' as const,
        attendees: 250,
        description: 'Annual technology conference',
        createdBy: 'John Doe'
      },
      {
        id: '2',
        name: 'Product Launch',
        date: '2024-12-20',
        location: 'Hotel Ballroom',
        status: 'draft' as const,
        attendees: 100,
        description: 'New product announcement',
        createdBy: 'Jane Smith'
      }
    ];
  },

  getEvent: async (id: string) => {
    return {
      id,
      name: 'Sample Event',
      date: '2024-12-15',
      location: 'Convention Center',
      status: 'published' as const,
      attendees: 250,
      description: 'Sample event description',
      createdBy: 'John Doe'
    };
  },

  createEvent: async (eventData: any) => {
    return { ...eventData, id: Date.now().toString() };
  },

  updateEvent: async (id: string, eventData: any) => {
    return { ...eventData, id };
  },

  deleteEvent: async (id: string) => {
    return { success: true };
  },

  // Users
  listUsers: async () => {
    return [
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin' as const,
        company: 'SiPanit',
        phone: '+1234567890'
      },
      {
        id: '2',
        email: 'planner@example.com',
        name: 'Event Planner',
        role: 'planner' as const,
        company: 'Event Co',
        phone: '+1234567891'
      }
    ];
  },

  getUser: async (id: string) => {
    return {
      id,
      email: 'user@example.com',
      name: 'Sample User',
      role: 'admin' as const,
      company: 'Sample Company',
      phone: '+1234567890'
    };
  },

  createUser: async (userData: any) => {
    return { ...userData, id: Date.now().toString() };
  },

  updateUser: async (id: string, userData: any) => {
    return { ...userData, id };
  },

  deleteUser: async (id: string) => {
    return { success: true };
  }
};

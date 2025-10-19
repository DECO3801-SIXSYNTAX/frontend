// src/tests/dashboardService.test.ts
import { DashboardService } from '../services/DashboardService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { Event, Guest, CreateEventForm } from '../types/dashboard';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }
}));
jest.mock('uuid', () => ({ v4: () => 'test-uuid-123' }));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    jest.clearAllMocks();

    // Mock serverTimestamp
    mockServerTimestamp.mockReturnValue({} as any);
  });

  describe('Event CRUD Operations', () => {
    describe('getEvents', () => {
      it('should fetch all events for current user', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Test Event 1',
            description: 'Description 1',
            type: 'conference',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            expectedAttendees: 100,
            actualAttendees: 0,
            status: 'draft',
            createdBy: 'test-user-123',
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01')
          },
          {
            id: 'event-2',
            name: 'Test Event 2',
            description: 'Description 2',
            type: 'workshop',
            startDate: '2025-02-15',
            endDate: '2025-02-16',
            expectedAttendees: 50,
            actualAttendees: 0,
            status: 'active',
            createdBy: 'test-user-123',
            createdAt: new Date('2025-01-02'),
            updatedAt: new Date('2025-01-02')
          }
        ];

        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockOrderBy.mockReturnValue({} as any);

        mockGetDocs.mockResolvedValue({
          docs: mockEvents.map(event => ({
            id: event.id,
            data: () => ({
              ...event,
              createdAt: { toDate: () => event.createdAt },
              updatedAt: { toDate: () => event.updatedAt }
            })
          }))
        } as any);

        const result = await service.getEvents();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Test Event 1');
        expect(result[1].name).toBe('Test Event 2');
        expect(mockGetDocs).toHaveBeenCalled();
      });

      it('should throw error when user is not authenticated', async () => {
        const originalUser = auth.currentUser;
        (auth as any).currentUser = null;

        await expect(service.getEvents()).rejects.toThrow('No user is currently signed in');

        (auth as any).currentUser = originalUser;
      });
    });

    describe('getEvent', () => {
      it('should fetch a specific event by ID', async () => {
        const mockEvent = {
          id: 'event-1',
          name: 'Test Event',
          description: 'Test Description',
          type: 'conference',
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          expectedAttendees: 100,
          actualAttendees: 0,
          status: 'draft',
          createdBy: 'test-user-123',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01')
        };

        mockDoc.mockReturnValue({} as any);
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: mockEvent.id,
          data: () => ({
            ...mockEvent,
            createdAt: { toDate: () => mockEvent.createdAt },
            updatedAt: { toDate: () => mockEvent.updatedAt }
          })
        } as any);

        const result = await service.getEvent('event-1');

        expect(result.id).toBe('event-1');
        expect(result.name).toBe('Test Event');
        expect(mockGetDoc).toHaveBeenCalled();
      });

      it('should throw error when event not found', async () => {
        mockDoc.mockReturnValue({} as any);
        mockGetDoc.mockResolvedValue({
          exists: () => false
        } as any);

        await expect(service.getEvent('non-existent-id')).rejects.toThrow('Event not found');
      });
    });

    describe('createEvent', () => {
      it('should create a new event successfully', async () => {
        const newEventData: CreateEventForm = {
          name: 'New Event',
          description: 'New Event Description',
          type: 'conference',
          startDate: '2025-03-15',
          endDate: '2025-03-16',
          venue: 'Test Location',
          address: '123 Test St',
          capacity: 200,
          expectedAttendees: 150,
          dietaryNeeds: 20,
          accessibilityNeeds: 5,
          budget: 10000,
          tags: [],
          priority: 'medium',
          notes: 'Test notes'
        };

        mockCollection.mockReturnValue({} as any);
        mockAddDoc.mockResolvedValue({
          id: 'new-event-id'
        } as any);

        const result = await service.createEvent(newEventData);

        expect(result.id).toBe('new-event-id');
        expect(result.name).toBe('New Event');
        expect(result.status).toBe('draft');
        expect(result.actualAttendees).toBe(0);
        expect(result.createdBy).toBe('test-user-123');
        expect(mockAddDoc).toHaveBeenCalled();
      });

      it('should create event with custom userId', async () => {
        const newEventData: CreateEventForm = {
          name: 'New Event',
          description: 'New Event Description',
          type: 'workshop',
          startDate: '2025-04-01',
          endDate: '2025-04-02',
          venue: 'Workshop Location',
          address: '456 Workshop Ave',
          capacity: 100,
          expectedAttendees: 50,
          dietaryNeeds: 10,
          accessibilityNeeds: 2,
          budget: 5000,
          tags: [],
          priority: 'high',
          notes: ''
        };

        mockCollection.mockReturnValue({} as any);
        mockAddDoc.mockResolvedValue({
          id: 'new-event-id-2'
        } as any);

        const result = await service.createEvent(newEventData, 'custom-user-id');

        expect(result.createdBy).toBe('custom-user-id');
        expect(mockAddDoc).toHaveBeenCalled();
      });
    });

    describe('updateEvent', () => {
      it('should update an existing event', async () => {
        const updates: Partial<Event> = {
          name: 'Updated Event Name',
          description: 'Updated Description',
          status: 'active'
        };

        mockDoc.mockReturnValue({} as any);
        mockUpdateDoc.mockResolvedValue(undefined);

        // Mock getEvent for the return value
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: 'event-1',
          data: () => ({
            name: 'Updated Event Name',
            description: 'Updated Description',
            status: 'active',
            type: 'conference',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            expectedAttendees: 100,
            actualAttendees: 0,
            createdBy: 'test-user-123',
            createdAt: { toDate: () => new Date('2025-01-01') },
            updatedAt: { toDate: () => new Date() }
          })
        } as any);

        const result = await service.updateEvent('event-1', updates);

        expect(result.name).toBe('Updated Event Name');
        expect(result.description).toBe('Updated Description');
        expect(result.status).toBe('active');
        expect(mockUpdateDoc).toHaveBeenCalled();
      });

      it('should remove undefined values from updates', async () => {
        const updates: Partial<Event> = {
          name: 'Updated Name',
          description: undefined,
          notes: undefined
        };

        mockDoc.mockReturnValue({} as any);
        mockUpdateDoc.mockResolvedValue(undefined);
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: 'event-1',
          data: () => ({
            name: 'Updated Name',
            type: 'conference',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            expectedAttendees: 100,
            actualAttendees: 0,
            status: 'draft',
            createdBy: 'test-user-123',
            createdAt: { toDate: () => new Date('2025-01-01') },
            updatedAt: { toDate: () => new Date() }
          })
        } as any);

        await service.updateEvent('event-1', updates);

        // Verify updateDoc was called and undefined values were filtered out
        expect(mockUpdateDoc).toHaveBeenCalled();
        const updateCall = mockUpdateDoc.mock.calls[0];
        const updateData = updateCall[1] as any;

        expect(updateData).toHaveProperty('name');
        expect(updateData).not.toHaveProperty('description');
        expect(updateData).not.toHaveProperty('notes');
      });
    });

    describe('deleteEvent', () => {
      it('should delete an event and its associated guests', async () => {
        const mockEvent = {
          id: 'event-1',
          name: 'Event to Delete',
          type: 'conference',
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          expectedAttendees: 100,
          actualAttendees: 0,
          status: 'draft',
          createdBy: 'test-user-123'
        };

        // Mock getEvent
        mockDoc.mockReturnValue({} as any);
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: mockEvent.id,
          data: () => ({
            ...mockEvent,
            createdAt: { toDate: () => new Date('2025-01-01') },
            updatedAt: { toDate: () => new Date('2025-01-01') }
          })
        } as any);

        // Mock guests query
        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockGetDocs.mockResolvedValue({
          docs: [
            { ref: {}, id: 'guest-1' },
            { ref: {}, id: 'guest-2' }
          ]
        } as any);

        mockDeleteDoc.mockResolvedValue(undefined);

        await service.deleteEvent('event-1');

        expect(mockDeleteDoc).toHaveBeenCalledTimes(3); // 1 event + 2 guests
      });
    });
  });

  describe('Guest Operations', () => {
    describe('getGuests', () => {
      it('should fetch guests for a specific event', async () => {
        const mockGuests = [
          {
            id: 'guest-1',
            eventId: 'event-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            dietaryRestrictions: 'Vegetarian',
            accessibilityNeeds: 'Wheelchair access',
            rsvpStatus: 'confirmed',
            importedAt: new Date('2025-01-01')
          },
          {
            id: 'guest-2',
            eventId: 'event-1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1234567891',
            dietaryRestrictions: 'None',
            accessibilityNeeds: 'None',
            rsvpStatus: 'pending',
            importedAt: new Date('2025-01-01')
          }
        ];

        mockCollection.mockReturnValue({} as any);
        mockQuery.mockReturnValue({} as any);
        mockWhere.mockReturnValue({} as any);
        mockGetDocs.mockResolvedValue({
          docs: mockGuests.map(guest => ({
            id: guest.id,
            data: () => ({
              ...guest,
              importedAt: { toDate: () => guest.importedAt }
            })
          }))
        } as any);

        const result = await service.getGuests('event-1');

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('John Doe');
        expect(result[1].name).toBe('Jane Smith');
      });
    });

    describe('importGuests', () => {
      it('should import multiple guests successfully', async () => {
        const guestsToImport: Omit<Guest, 'id' | 'importedAt'>[] = [
          {
            eventId: 'event-1',
            name: 'Guest 1',
            email: 'guest1@example.com',
            phone: '+1111111111',
            dietaryRestrictions: 'None',
            accessibilityNeeds: 'None',
            rsvpStatus: 'pending'
          },
          {
            eventId: 'event-1',
            name: 'Guest 2',
            email: 'guest2@example.com',
            phone: '+2222222222',
            dietaryRestrictions: 'Vegan',
            accessibilityNeeds: 'None',
            rsvpStatus: 'pending'
          }
        ];

        mockCollection.mockReturnValue({} as any);
        mockAddDoc.mockResolvedValueOnce({ id: 'guest-id-1' } as any);
        mockAddDoc.mockResolvedValueOnce({ id: 'guest-id-2' } as any);

        const result = await service.importGuests(guestsToImport);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('guest-id-1');
        expect(result[1].id).toBe('guest-id-2');
        expect(mockAddDoc).toHaveBeenCalledTimes(2);
      });
    });

    describe('updateGuest', () => {
      it('should update a guest successfully', async () => {
        const updates: Partial<Guest> = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };

        mockDoc.mockReturnValue({} as any);
        mockUpdateDoc.mockResolvedValue(undefined);
        mockGetDoc.mockResolvedValue({
          id: 'guest-1',
          data: () => ({
            eventId: 'event-1',
            name: 'Updated Name',
            email: 'updated@example.com',
            phone: '+1234567890',
            dietaryRestrictions: 'None',
            accessibilityNeeds: 'None',
            rsvpStatus: 'confirmed',
            importedAt: { toDate: () => new Date('2025-01-01') }
          })
        } as any);

        const result = await service.updateGuest('guest-1', updates);

        expect(result.name).toBe('Updated Name');
        expect(result.email).toBe('updated@example.com');
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });

    describe('deleteGuest', () => {
      it('should delete a guest successfully', async () => {
        mockDoc.mockReturnValue({} as any);
        mockDeleteDoc.mockResolvedValue(undefined);

        await service.deleteGuest('guest-1');

        expect(mockDeleteDoc).toHaveBeenCalled();
      });
    });
  });

  describe('Statistics', () => {
    it('should calculate event statistics correctly', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Event 1',
          type: 'conference',
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          expectedAttendees: 100,
          actualAttendees: 80,
          dietaryNeeds: 15,
          accessibilityNeeds: 5,
          status: 'done',
          createdBy: 'test-user-123',
          createdAt: { toDate: () => new Date('2025-01-01') },
          updatedAt: { toDate: () => new Date('2025-01-01') }
        },
        {
          id: 'event-2',
          name: 'Event 2',
          type: 'workshop',
          startDate: '2025-02-15',
          endDate: '2025-02-16',
          expectedAttendees: 50,
          actualAttendees: 45,
          dietaryNeeds: 10,
          accessibilityNeeds: 3,
          status: 'active',
          createdBy: 'test-user-123',
          createdAt: { toDate: () => new Date('2025-01-02') },
          updatedAt: { toDate: () => new Date('2025-01-02') }
        }
      ];

      mockCollection.mockReturnValue({} as any);
      mockQuery.mockReturnValue({} as any);
      mockWhere.mockReturnValue({} as any);
      mockOrderBy.mockReturnValue({} as any);

      mockGetDocs.mockResolvedValue({
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => event
        }))
      } as any);

      const result = await service.getEventStatistics();

      expect(result.totalGuests).toBe(150); // 100 + 50
      expect(result.assignedSeats).toBe(125); // 80 + 45
      expect(result.dietaryNeeds).toBe(25); // 15 + 10
      expect(result.accessibilityNeeds).toBe(8); // 5 + 3
      expect(result.completionRate).toBe(50); // 1 done out of 2 events
    });
  });
});

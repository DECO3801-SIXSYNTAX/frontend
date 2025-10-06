import api from '@/lib/api';
import type { Event, ApiResponse } from '@/types/api';

export interface CreateEventRequest {
  name: string;
  description: string;
  date: string;
  venue: string;
  status?: Event['status'];
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  date?: string;
  venue?: string;
  status?: Event['status'];
}

export const eventsService = {
  getEvents: async (params?: { 
    status?: string; 
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<ApiResponse<Event>> => {
    const response = await api.get('/admin/events/', { params });
    return response.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const response = await api.get(`/admin/events/${id}/`);
    return response.data;
  },

  createEvent: async (eventData: CreateEventRequest): Promise<Event> => {
    const response = await api.post('/admin/events/', eventData);
    return response.data;
  },

  updateEvent: async (id: string, eventData: UpdateEventRequest): Promise<Event> => {
    const response = await api.patch(`/admin/events/${id}/`, eventData);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/admin/events/${id}/`);
  },
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService, type CreateEventRequest, type UpdateEventRequest } from '@/services/events';
import type { Event } from '@/types/api';

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...eventKeys.lists(), { filters }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// Hooks

// MOCK: Return empty event list so frontend can run without backend
export const useEvents = (params?: { 
  status?: string; 
  page?: number;
  page_size?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: eventKeys.list(params || {}),
    queryFn: async () => ({
      count: 0,
      results: [],
    }),
    staleTime: 5 * 60 * 1000,
  });
};


// MOCK: Return a placeholder event so frontend can render
export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => ({
      id,
      name: 'Sample Event',
      description: 'This is a sample event (API not connected).',
      date: new Date().toISOString(),
      venue: 'Sample Venue',
      status: 'draft',
    }),
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventData: CreateEventRequest) => eventsService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, eventData }: { id: string; eventData: UpdateEventRequest }) => 
      eventsService.updateEvent(id, eventData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.setQueryData(eventKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => eventsService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
};

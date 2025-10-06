import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/api';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Hooks

// MOCK: Return empty user list so frontend can run without backend
export const useUsers = (params?: { 
  role?: string; 
  is_active?: boolean; 
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: userKeys.list(params || {}),
    queryFn: async () => ({
      count: 0,
      results: [],
    }),
    staleTime: 5 * 60 * 1000,
  });
};


// MOCK: Return a placeholder user so frontend can render
export const useUser = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => ({
      id,
      username: 'sampleuser',
      email: 'sample@example.com',
      first_name: 'Sample',
      last_name: 'User',
      is_active: true,
      role: 'admin',
    }),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: UpdateUserRequest }) => 
      usersService.updateUser(id, userData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.setQueryData(userKeys.detail(variables.id), data);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useBulkUpdateUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[]; updates: UpdateUserRequest }) => 
      usersService.bulkUpdateUsers(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

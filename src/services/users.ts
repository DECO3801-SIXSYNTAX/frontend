import api from '../lib/api';
import type { 
  User, 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../types/api';

// Authentication
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/token/', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
};

// Users API
export const usersService = {
  getUsers: async (params?: { 
    role?: string; 
    is_active?: boolean; 
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<User>> => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/admin/users/${id}/`);
    return response.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post('/admin/users/', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: UpdateUserRequest): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}/`);
  },

  bulkUpdateUsers: async (ids: number[], updates: UpdateUserRequest): Promise<void> => {
    await api.patch('/admin/users/bulk_update/', {
      user_ids: ids,
      updates,
    });
  },
};

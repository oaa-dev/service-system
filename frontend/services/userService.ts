import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  SyncRolesRequest,
} from '@/types/api';

export const userService = {
  /**
   * Get paginated list of users with optional filtering/sorting
   */
  getAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/users', { params });
    return response.data;
  },

  /**
   * Get a single user by ID
   */
  getById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  create: async (data: CreateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },

  /**
   * Update a user
   */
  update: async (id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete a user
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },

  /**
   * Sync roles for a user
   */
  syncRoles: async (id: number, data: SyncRolesRequest): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>(`/users/${id}/roles`, data);
    return response.data;
  },
};

import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  SyncPermissionsRequest,
  Permission,
  PermissionGroup,
  RoleQueryParams,
} from '@/types/api';

export const roleService = {
  /**
   * Get paginated list of roles with optional filtering/sorting
   */
  getAll: async (params?: RoleQueryParams): Promise<PaginatedResponse<Role>> => {
    const response = await api.get<PaginatedResponse<Role>>('/roles', { params });
    return response.data;
  },

  /**
   * Get all roles without pagination (for dropdowns)
   */
  getAllUnpaginated: async (): Promise<ApiResponse<Role[]>> => {
    const response = await api.get<ApiResponse<Role[]>>('/roles/all');
    return response.data;
  },

  /**
   * Get a single role by ID
   */
  getById: async (id: number): Promise<ApiResponse<Role>> => {
    const response = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Create a new role
   */
  create: async (data: CreateRoleRequest): Promise<ApiResponse<Role>> => {
    const response = await api.post<ApiResponse<Role>>('/roles', data);
    return response.data;
  },

  /**
   * Update a role
   */
  update: async (id: number, data: UpdateRoleRequest): Promise<ApiResponse<Role>> => {
    const response = await api.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return response.data;
  },

  /**
   * Delete a role
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/roles/${id}`);
    return response.data;
  },

  /**
   * Sync permissions for a role
   */
  syncPermissions: async (id: number, data: SyncPermissionsRequest): Promise<ApiResponse<Role>> => {
    const response = await api.post<ApiResponse<Role>>(`/roles/${id}/permissions`, data);
    return response.data;
  },

  /**
   * Get all permissions
   */
  getPermissions: async (): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get<ApiResponse<Permission[]>>('/permissions');
    return response.data;
  },

  /**
   * Get permissions grouped by module
   */
  getPermissionsGrouped: async (): Promise<ApiResponse<PermissionGroup>> => {
    const response = await api.get<ApiResponse<PermissionGroup>>('/permissions/grouped');
    return response.data;
  },
};

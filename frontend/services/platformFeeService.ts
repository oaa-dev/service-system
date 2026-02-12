import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  PlatformFee,
  CreatePlatformFeeRequest,
  UpdatePlatformFeeRequest,
  PlatformFeeQueryParams,
} from '@/types/api';

export const platformFeeService = {
  getAll: async (params?: PlatformFeeQueryParams): Promise<PaginatedResponse<PlatformFee>> => {
    const response = await api.get<PaginatedResponse<PlatformFee>>('/platform-fees', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<PlatformFee[]>> => {
    const response = await api.get<ApiResponse<PlatformFee[]>>('/platform-fees/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<PlatformFee[]>> => {
    const response = await api.get<ApiResponse<PlatformFee[]>>('/platform-fees/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<PlatformFee>> => {
    const response = await api.get<ApiResponse<PlatformFee>>(`/platform-fees/${id}`);
    return response.data;
  },

  create: async (data: CreatePlatformFeeRequest): Promise<ApiResponse<PlatformFee>> => {
    const response = await api.post<ApiResponse<PlatformFee>>('/platform-fees', data);
    return response.data;
  },

  update: async (id: number, data: UpdatePlatformFeeRequest): Promise<ApiResponse<PlatformFee>> => {
    const response = await api.put<ApiResponse<PlatformFee>>(`/platform-fees/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/platform-fees/${id}`);
    return response.data;
  },
};

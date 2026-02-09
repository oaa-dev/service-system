import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  BusinessType,
  CreateBusinessTypeRequest,
  UpdateBusinessTypeRequest,
  BusinessTypeQueryParams,
} from '@/types/api';

export const businessTypeService = {
  getAll: async (params?: BusinessTypeQueryParams): Promise<PaginatedResponse<BusinessType>> => {
    const response = await api.get<PaginatedResponse<BusinessType>>('/business-types', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<BusinessType[]>> => {
    const response = await api.get<ApiResponse<BusinessType[]>>('/business-types/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<BusinessType[]>> => {
    const response = await api.get<ApiResponse<BusinessType[]>>('/business-types/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<BusinessType>> => {
    const response = await api.get<ApiResponse<BusinessType>>(`/business-types/${id}`);
    return response.data;
  },

  create: async (data: CreateBusinessTypeRequest): Promise<ApiResponse<BusinessType>> => {
    const response = await api.post<ApiResponse<BusinessType>>('/business-types', data);
    return response.data;
  },

  update: async (id: number, data: UpdateBusinessTypeRequest): Promise<ApiResponse<BusinessType>> => {
    const response = await api.put<ApiResponse<BusinessType>>(`/business-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/business-types/${id}`);
    return response.data;
  },
};

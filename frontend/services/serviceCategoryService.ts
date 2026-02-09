import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  ServiceCategory,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
  ServiceCategoryQueryParams,
} from '@/types/api';

export const serviceCategoryService = {
  getAll: async (merchantId: number, params?: ServiceCategoryQueryParams): Promise<PaginatedResponse<ServiceCategory>> => {
    const response = await api.get<PaginatedResponse<ServiceCategory>>(`/merchants/${merchantId}/service-categories`, { params });
    return response.data;
  },

  getAllUnpaginated: async (merchantId: number): Promise<ApiResponse<ServiceCategory[]>> => {
    const response = await api.get<ApiResponse<ServiceCategory[]>>(`/merchants/${merchantId}/service-categories/all`);
    return response.data;
  },

  getActive: async (merchantId: number): Promise<ApiResponse<ServiceCategory[]>> => {
    const response = await api.get<ApiResponse<ServiceCategory[]>>(`/merchants/${merchantId}/service-categories/active`);
    return response.data;
  },

  getById: async (merchantId: number, id: number): Promise<ApiResponse<ServiceCategory>> => {
    const response = await api.get<ApiResponse<ServiceCategory>>(`/merchants/${merchantId}/service-categories/${id}`);
    return response.data;
  },

  create: async (merchantId: number, data: CreateServiceCategoryRequest): Promise<ApiResponse<ServiceCategory>> => {
    const response = await api.post<ApiResponse<ServiceCategory>>(`/merchants/${merchantId}/service-categories`, data);
    return response.data;
  },

  update: async (merchantId: number, id: number, data: UpdateServiceCategoryRequest): Promise<ApiResponse<ServiceCategory>> => {
    const response = await api.put<ApiResponse<ServiceCategory>>(`/merchants/${merchantId}/service-categories/${id}`, data);
    return response.data;
  },

  delete: async (merchantId: number, id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${merchantId}/service-categories/${id}`);
    return response.data;
  },
};

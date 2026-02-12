import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  CustomerTag,
  CreateCustomerTagRequest,
  UpdateCustomerTagRequest,
  CustomerTagQueryParams,
} from '@/types/api';

export const customerTagService = {
  getAll: async (params?: CustomerTagQueryParams): Promise<PaginatedResponse<CustomerTag>> => {
    const response = await api.get<PaginatedResponse<CustomerTag>>('/customer-tags', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<CustomerTag[]>> => {
    const response = await api.get<ApiResponse<CustomerTag[]>>('/customer-tags/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<CustomerTag[]>> => {
    const response = await api.get<ApiResponse<CustomerTag[]>>('/customer-tags/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<CustomerTag>> => {
    const response = await api.get<ApiResponse<CustomerTag>>(`/customer-tags/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerTagRequest): Promise<ApiResponse<CustomerTag>> => {
    const response = await api.post<ApiResponse<CustomerTag>>('/customer-tags', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCustomerTagRequest): Promise<ApiResponse<CustomerTag>> => {
    const response = await api.put<ApiResponse<CustomerTag>>(`/customer-tags/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/customer-tags/${id}`);
    return response.data;
  },
};

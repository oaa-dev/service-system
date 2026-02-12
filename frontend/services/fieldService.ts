import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Field,
  CreateFieldRequest,
  UpdateFieldRequest,
  FieldQueryParams,
} from '@/types/api';

export const fieldService = {
  getAll: async (params?: FieldQueryParams) => {
    const response = await api.get<PaginatedResponse<Field>>('/fields', { params });
    return response.data;
  },

  getAllWithoutPagination: async () => {
    const response = await api.get<ApiResponse<Field[]>>('/fields/all');
    return response.data;
  },

  getActive: async () => {
    const response = await api.get<ApiResponse<Field[]>>('/fields/active');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<ApiResponse<Field>>(`/fields/${id}`);
    return response.data;
  },

  create: async (data: CreateFieldRequest) => {
    const response = await api.post<ApiResponse<Field>>('/fields', data);
    return response.data;
  },

  update: async (id: number, data: UpdateFieldRequest) => {
    const response = await api.put<ApiResponse<Field>>(`/fields/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<null>>(`/fields/${id}`);
    return response.data;
  },
};

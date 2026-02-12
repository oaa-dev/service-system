import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  ServiceOrder,
  CreateServiceOrderRequest,
  UpdateServiceOrderStatusRequest,
  ServiceOrderQueryParams,
} from '@/types/api';

export const serviceOrderService = {
  getAll: async (merchantId: number, params?: ServiceOrderQueryParams): Promise<PaginatedResponse<ServiceOrder>> => {
    const response = await api.get<PaginatedResponse<ServiceOrder>>(`/merchants/${merchantId}/service-orders`, { params });
    return response.data;
  },

  getById: async (merchantId: number, serviceOrderId: number): Promise<ApiResponse<ServiceOrder>> => {
    const response = await api.get<ApiResponse<ServiceOrder>>(`/merchants/${merchantId}/service-orders/${serviceOrderId}`);
    return response.data;
  },

  create: async (merchantId: number, data: CreateServiceOrderRequest): Promise<ApiResponse<ServiceOrder>> => {
    const response = await api.post<ApiResponse<ServiceOrder>>(`/merchants/${merchantId}/service-orders`, data);
    return response.data;
  },

  updateStatus: async (merchantId: number, serviceOrderId: number, data: UpdateServiceOrderStatusRequest): Promise<ApiResponse<ServiceOrder>> => {
    const response = await api.patch<ApiResponse<ServiceOrder>>(`/merchants/${merchantId}/service-orders/${serviceOrderId}/status`, data);
    return response.data;
  },
};

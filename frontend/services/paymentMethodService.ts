import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodQueryParams,
} from '@/types/api';

export const paymentMethodService = {
  getAll: async (params?: PaymentMethodQueryParams): Promise<PaginatedResponse<PaymentMethod>> => {
    const response = await api.get<PaginatedResponse<PaymentMethod>>('/payment-methods', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/payment-methods/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/payment-methods/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<PaymentMethod>> => {
    const response = await api.get<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`);
    return response.data;
  },

  create: async (data: CreatePaymentMethodRequest): Promise<ApiResponse<PaymentMethod>> => {
    const response = await api.post<ApiResponse<PaymentMethod>>('/payment-methods', data);
    return response.data;
  },

  update: async (id: number, data: UpdatePaymentMethodRequest): Promise<ApiResponse<PaymentMethod>> => {
    const response = await api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/payment-methods/${id}`);
    return response.data;
  },
};

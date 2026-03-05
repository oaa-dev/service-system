import api from '@/lib/axios';
import { ApiResponse, Payment, MarkAsPaidRequest, RequestRefundRequest } from '@/types/api';

export const paymentService = {
  getPayment: async (id: number): Promise<ApiResponse<Payment>> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  },

  markAsPaid: async (id: number, data?: MarkAsPaidRequest): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/mark-paid`, data);
    return response.data;
  },

  requestRefund: async (id: number, data?: RequestRefundRequest): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/request-refund`, data);
    return response.data;
  },

  markRefunded: async (id: number): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/mark-refunded`);
    return response.data;
  },

  checkStatus: async (id: number): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/payments/${id}/check-status`);
    return response.data;
  },
};

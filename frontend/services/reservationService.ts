import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Reservation,
  CreateReservationRequest,
  UpdateReservationStatusRequest,
  ReservationQueryParams,
} from '@/types/api';

export const reservationService = {
  getAll: async (merchantId: number, params?: ReservationQueryParams): Promise<PaginatedResponse<Reservation>> => {
    const response = await api.get<PaginatedResponse<Reservation>>(`/merchants/${merchantId}/reservations`, { params });
    return response.data;
  },

  getById: async (merchantId: number, reservationId: number): Promise<ApiResponse<Reservation>> => {
    const response = await api.get<ApiResponse<Reservation>>(`/merchants/${merchantId}/reservations/${reservationId}`);
    return response.data;
  },

  create: async (merchantId: number, data: CreateReservationRequest): Promise<ApiResponse<Reservation>> => {
    const response = await api.post<ApiResponse<Reservation>>(`/merchants/${merchantId}/reservations`, data);
    return response.data;
  },

  updateStatus: async (merchantId: number, reservationId: number, data: UpdateReservationStatusRequest): Promise<ApiResponse<Reservation>> => {
    const response = await api.patch<ApiResponse<Reservation>>(`/merchants/${merchantId}/reservations/${reservationId}/status`, data);
    return response.data;
  },
};

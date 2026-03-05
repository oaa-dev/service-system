import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Booking,
  BookingCalendarDay,
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  BookingQueryParams,
} from '@/types/api';

export const bookingService = {
  getAll: async (merchantId: number, params?: BookingQueryParams): Promise<PaginatedResponse<Booking>> => {
    const response = await api.get<PaginatedResponse<Booking>>(`/merchants/${merchantId}/bookings`, { params });
    return response.data;
  },

  getById: async (merchantId: number, bookingId: number): Promise<ApiResponse<Booking>> => {
    const response = await api.get<ApiResponse<Booking>>(`/merchants/${merchantId}/bookings/${bookingId}`);
    return response.data;
  },

  create: async (merchantId: number, data: CreateBookingRequest): Promise<ApiResponse<Booking>> => {
    const response = await api.post<ApiResponse<Booking>>(`/merchants/${merchantId}/bookings`, data);
    return response.data;
  },

  updateStatus: async (merchantId: number, bookingId: number, data: UpdateBookingStatusRequest): Promise<ApiResponse<Booking>> => {
    const response = await api.patch<ApiResponse<Booking>>(`/merchants/${merchantId}/bookings/${bookingId}/status`, data);
    return response.data;
  },

  getCalendar: async (month: string): Promise<BookingCalendarDay[]> => {
    const response = await api.get<ApiResponse<BookingCalendarDay[]>>(
      '/auth/merchant/bookings/calendar',
      { params: { month } }
    );
    return response.data.data;
  },
};

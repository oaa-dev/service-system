import api from '@/lib/axios';
import { ApiResponse, Booking, Reservation, ServiceOrder } from '@/types/api';

export interface CreateBookingPayload {
  service_id: number;
  booking_date: string;
  start_time: string;
  party_size?: number;
  notes?: string;
}

export interface CreateReservationPayload {
  service_id: number;
  check_in: string;
  check_out: string;
  guest_count?: number;
  notes?: string;
  special_requests?: string;
}

export interface CreateOrderPayload {
  service_id: number;
  quantity: number;
  unit_label: string;
  notes?: string;
}

export const customerActionService = {
  createBooking: async (slug: string, data: CreateBookingPayload): Promise<ApiResponse<Booking>> => {
    const response = await api.post<ApiResponse<Booking>>(`/customer/merchants/${slug}/bookings`, data);
    return response.data;
  },
  createReservation: async (slug: string, data: CreateReservationPayload): Promise<ApiResponse<Reservation>> => {
    const response = await api.post<ApiResponse<Reservation>>(`/customer/merchants/${slug}/reservations`, data);
    return response.data;
  },
  createOrder: async (slug: string, data: CreateOrderPayload): Promise<ApiResponse<ServiceOrder>> => {
    const response = await api.post<ApiResponse<ServiceOrder>>(`/customer/merchants/${slug}/orders`, data);
    return response.data;
  },
};

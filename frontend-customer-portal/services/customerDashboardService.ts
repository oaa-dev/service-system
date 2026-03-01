import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse, Booking, Reservation, ServiceOrder } from '@/types/api';

export interface MyBookingParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  sort?: string;
}

export interface MyReservationParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  sort?: string;
}

export interface MyOrderParams {
  page?: number;
  per_page?: number;
  'filter[status]'?: string;
  'filter[date_from]'?: string;
  'filter[date_to]'?: string;
  'filter[search]'?: string;
  sort?: string;
}

export interface CustomerStats {
  bookings: { total: number; upcoming: number };
  reservations: { total: number; active: number };
  orders: { total: number; active: number };
}

export const customerDashboardService = {
  getMyStats: () => api.get<ApiResponse<CustomerStats>>('/customer/my/stats').then(r => r.data),
  getMyBookings: (params?: MyBookingParams) => api.get<PaginatedResponse<Booking>>('/customer/my/bookings', { params }).then(r => r.data),
  getMyBooking: (id: number) => api.get<ApiResponse<Booking>>(`/customer/my/bookings/${id}`).then(r => r.data),
  cancelMyBooking: (id: number) => api.patch<ApiResponse<Booking>>(`/customer/my/bookings/${id}/cancel`).then(r => r.data),
  getMyReservations: (params?: MyReservationParams) => api.get<PaginatedResponse<Reservation>>('/customer/my/reservations', { params }).then(r => r.data),
  getMyReservation: (id: number) => api.get<ApiResponse<Reservation>>(`/customer/my/reservations/${id}`).then(r => r.data),
  cancelMyReservation: (id: number) => api.patch<ApiResponse<Reservation>>(`/customer/my/reservations/${id}/cancel`).then(r => r.data),
  getMyOrders: (params?: MyOrderParams) => api.get<PaginatedResponse<ServiceOrder>>('/customer/my/orders', { params }).then(r => r.data),
  getMyOrder: (id: number) => api.get<ApiResponse<ServiceOrder>>(`/customer/my/orders/${id}`).then(r => r.data),
  cancelMyOrder: (id: number) => api.patch<ApiResponse<ServiceOrder>>(`/customer/my/orders/${id}/cancel`).then(r => r.data),
};

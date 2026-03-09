import api from '@/lib/axios';
import { ApiResponse, Booking, Coupon, MyCouponItem, Payment, Reservation, ServiceOrder } from '@/types/api';

export interface CreateBookingPayload {
  service_id: number;
  booking_date: string;
  start_time?: string;
  booking_slot_id?: number;
  party_size: number;
  notes?: string;
  loyalty_reward_id?: number;
  coupon_code?: string;
}

export interface CreateReservationPayload {
  service_id: number;
  check_in: string;
  check_out: string;
  guest_count?: number;
  notes?: string;
  special_requests?: string;
  loyalty_reward_id?: number;
  coupon_code?: string;
}

export interface CreateOrderPayload {
  service_id: number;
  quantity: number;
  unit_label: string;
  notes?: string;
  loyalty_reward_id?: number;
  coupon_code?: string;
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
  claimCoupon: async (couponId: number): Promise<ApiResponse<{ claimed_at: string; expires_at: string }>> => {
    const response = await api.post<ApiResponse<{ claimed_at: string; expires_at: string }>>(`/customer/coupons/${couponId}/claim`);
    return response.data;
  },
  getClaimedCoupons: async (): Promise<ApiResponse<Coupon[]>> => {
    const response = await api.get<ApiResponse<Coupon[]>>('/customer/coupons/claimed');
    return response.data;
  },
  getMyCoupons: async (): Promise<ApiResponse<MyCouponItem[]>> => {
    const response = await api.get<ApiResponse<MyCouponItem[]>>('/customer/my/coupons');
    return response.data;
  },
  checkPaymentStatus: async (paymentId: number): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>(`/customer/my/payments/${paymentId}/check-status`);
    return response.data;
  },
};

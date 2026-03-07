import api from '@/lib/axios';
import type {
  Coupon,
  CouponQueryParams,
  CreateCouponRequest,
  UpdateCouponRequest,
  ValidateCouponRequest,
  ValidateCouponResponse,
  PaginatedResponse,
} from '@/types/api';

export const couponService = {
  // Admin: list all coupons (platform + merchant)
  getCoupons: async (params?: CouponQueryParams): Promise<PaginatedResponse<Coupon>> => {
    const response = await api.get<PaginatedResponse<Coupon>>('/coupons', { params });
    return response.data;
  },

  // Admin: get single coupon
  getCoupon: async (id: number): Promise<Coupon> => {
    const response = await api.get<{ success: boolean; data: Coupon }>(`/coupons/${id}`);
    return response.data.data;
  },

  // Admin: create platform coupon
  createCoupon: async (data: CreateCouponRequest): Promise<Coupon> => {
    const response = await api.post<{ success: boolean; data: Coupon }>('/coupons', data);
    return response.data.data;
  },

  // Admin: update coupon
  updateCoupon: async (id: number, data: UpdateCouponRequest): Promise<Coupon> => {
    const response = await api.put<{ success: boolean; data: Coupon }>(`/coupons/${id}`, data);
    return response.data.data;
  },

  // Admin: delete coupon
  deleteCoupon: async (id: number): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  },

  // Merchant self-service: list own coupons
  getMyCoupons: async (params?: CouponQueryParams): Promise<PaginatedResponse<Coupon>> => {
    const response = await api.get<PaginatedResponse<Coupon>>('/auth/merchant/coupons', { params });
    return response.data;
  },

  // Merchant self-service: create coupon
  createMyCoupon: async (data: CreateCouponRequest): Promise<Coupon> => {
    const response = await api.post<{ success: boolean; data: Coupon }>('/auth/merchant/coupons', data);
    return response.data.data;
  },

  // Merchant self-service: update coupon
  updateMyCoupon: async (id: number, data: UpdateCouponRequest): Promise<Coupon> => {
    const response = await api.put<{ success: boolean; data: Coupon }>(`/auth/merchant/coupons/${id}`, data);
    return response.data.data;
  },

  // Merchant self-service: delete coupon
  deleteMyCoupon: async (id: number): Promise<void> => {
    await api.delete(`/auth/merchant/coupons/${id}`);
  },

  // Public: validate coupon code
  validateCoupon: async (data: ValidateCouponRequest): Promise<ValidateCouponResponse> => {
    const response = await api.post<{ success: boolean; data: ValidateCouponResponse }>('/coupons/validate', data);
    return response.data.data;
  },
};

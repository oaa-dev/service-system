import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse, Merchant, Service, BusinessType, PaymentMethod, BookingAvailabilityResponse, ReservationAvailabilityResponse } from '@/types/api';

export interface StorefrontMerchantParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[business_type_id]'?: number;
  'filter[can_sell_products]'?: boolean;
  'filter[can_take_bookings]'?: boolean;
  'filter[can_rent_units]'?: boolean;
}

export interface StorefrontServiceParams {
  page?: number;
  per_page?: number;
  sort?: string;
  'filter[search]'?: string;
  'filter[service_category_id]'?: number;
  'filter[is_bookable]'?: boolean;
  'filter[is_sellable]'?: boolean;
}

export const storefrontService = {
  getMerchants: async (params?: StorefrontMerchantParams): Promise<PaginatedResponse<Merchant>> => {
    const response = await api.get<PaginatedResponse<Merchant>>('/storefront/merchants', { params });
    return response.data;
  },
  getMerchantBySlug: async (slug: string): Promise<ApiResponse<Merchant>> => {
    const response = await api.get<ApiResponse<Merchant>>(`/storefront/merchants/${slug}`);
    return response.data;
  },
  getMerchantServices: async (slug: string, params?: StorefrontServiceParams): Promise<PaginatedResponse<Service>> => {
    const response = await api.get<PaginatedResponse<Service>>(`/storefront/merchants/${slug}/services`, { params });
    return response.data;
  },
  getServiceDetail: async (slug: string, serviceId: number): Promise<ApiResponse<Service>> => {
    const response = await api.get<ApiResponse<Service>>(`/storefront/merchants/${slug}/services/${serviceId}`);
    return response.data;
  },
  getBusinessTypes: async (): Promise<ApiResponse<BusinessType[]>> => {
    const response = await api.get<ApiResponse<BusinessType[]>>('/storefront/business-types');
    return response.data;
  },
  getPaymentMethods: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.get<ApiResponse<PaymentMethod[]>>('/storefront/payment-methods');
    return response.data;
  },
  getMapMerchants: async (params?: { lat?: number; lng?: number; radius?: number }): Promise<ApiResponse<Merchant[]>> => {
    const response = await api.get<ApiResponse<Merchant[]>>('/storefront/merchants/map', { params });
    return response.data;
  },
  getBookingAvailability: async (slug: string, serviceId: number, month: string): Promise<ApiResponse<BookingAvailabilityResponse>> => {
    const response = await api.get<ApiResponse<BookingAvailabilityResponse>>(
      `/storefront/merchants/${slug}/services/${serviceId}/booking-availability`,
      { params: { month } },
    );
    return response.data;
  },
  getReservationAvailability: async (slug: string, serviceId: number, month: string): Promise<ApiResponse<ReservationAvailabilityResponse>> => {
    const response = await api.get<ApiResponse<ReservationAvailabilityResponse>>(
      `/storefront/merchants/${slug}/services/${serviceId}/reservation-availability`,
      { params: { month } },
    );
    return response.data;
  },
};

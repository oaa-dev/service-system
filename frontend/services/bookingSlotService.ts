import api from '@/lib/axios';
import { ApiResponse, MerchantBookingSlot } from '@/types/api';

const BASE_SELF = '/auth/merchant/booking-slots';
const BASE_ADMIN = (merchantId: number) => `/merchants/${merchantId}/booking-slots`;

export const bookingSlotService = {
  getAll: async (merchantId?: number): Promise<MerchantBookingSlot[]> => {
    const url = merchantId ? BASE_ADMIN(merchantId) : BASE_SELF;
    const res = await api.get<ApiResponse<MerchantBookingSlot[]>>(url);
    return res.data.data;
  },

  getById: async (slotId: number, merchantId?: number): Promise<MerchantBookingSlot> => {
    const url = merchantId
      ? `${BASE_ADMIN(merchantId)}/${slotId}`
      : `${BASE_SELF}/${slotId}`;
    const res = await api.get<ApiResponse<MerchantBookingSlot>>(url);
    return res.data.data;
  },

  create: async (
    data: Partial<MerchantBookingSlot>,
    merchantId?: number
  ): Promise<MerchantBookingSlot> => {
    const url = merchantId ? BASE_ADMIN(merchantId) : BASE_SELF;
    const res = await api.post<ApiResponse<MerchantBookingSlot>>(url, data);
    return res.data.data;
  },

  update: async (
    slotId: number,
    data: Partial<MerchantBookingSlot>,
    merchantId?: number
  ): Promise<MerchantBookingSlot> => {
    const url = merchantId
      ? `${BASE_ADMIN(merchantId)}/${slotId}`
      : `${BASE_SELF}/${slotId}`;
    const res = await api.put<ApiResponse<MerchantBookingSlot>>(url, data);
    return res.data.data;
  },

  delete: async (slotId: number, merchantId?: number): Promise<void> => {
    const url = merchantId
      ? `${BASE_ADMIN(merchantId)}/${slotId}`
      : `${BASE_SELF}/${slotId}`;
    await api.delete(url);
  },
};

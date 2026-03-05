import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  ReferralProgram,
  Referral,
  ReferralStats,
  CreateReferralProgramRequest,
  ReferralQueryParams,
} from '@/types/api';

export const referralService = {
  getMyReferralProgram: async (): Promise<ReferralProgram | null> => {
    const response = await api.get<ApiResponse<ReferralProgram>>('/auth/merchant/referral-program');
    return response.data.data ?? null;
  },

  createOrUpdateReferralProgram: async (data: CreateReferralProgramRequest): Promise<ReferralProgram> => {
    const response = await api.post<ApiResponse<ReferralProgram>>('/auth/merchant/referral-program', data);
    return response.data.data;
  },

  deactivateReferralProgram: async (): Promise<void> => {
    await api.delete('/auth/merchant/referral-program');
  },

  getMerchantReferrals: async (params?: ReferralQueryParams): Promise<PaginatedResponse<Referral>> => {
    const response = await api.get<PaginatedResponse<Referral>>('/auth/merchant/referrals', { params });
    return response.data;
  },

  getReferralStats: async (): Promise<ReferralStats> => {
    const response = await api.get<ApiResponse<ReferralStats>>('/auth/merchant/referral-stats');
    return response.data.data;
  },

  getAdminReferralProgram: async (merchantId: number): Promise<ReferralProgram | null> => {
    const response = await api.get<ApiResponse<ReferralProgram>>(`/merchants/${merchantId}/referral-program`);
    return response.data.data ?? null;
  },

  updateAdminReferralProgram: async (
    merchantId: number,
    data: CreateReferralProgramRequest
  ): Promise<ReferralProgram> => {
    const response = await api.put<ApiResponse<ReferralProgram>>(
      `/merchants/${merchantId}/referral-program`,
      data
    );
    return response.data.data;
  },
};

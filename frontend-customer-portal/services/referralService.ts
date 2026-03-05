import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  ReferralCode,
  Referral,
  ReferralReward,
  ReferralValidation,
  ReferralRewardQueryParams,
} from '@/types/api';

const referralService = {
  generateReferralCode: async (merchantId: number): Promise<ReferralCode> => {
    const response = await api.post<ApiResponse<ReferralCode>>(`/customer/referrals/generate/${merchantId}`);
    return response.data.data;
  },

  getMyReferralCodes: async (): Promise<ApiResponse<ReferralCode[]>> => {
    const response = await api.get<ApiResponse<ReferralCode[]>>('/customer/referral-codes');
    return response.data;
  },

  getMyReferrals: async (): Promise<ApiResponse<Referral[]>> => {
    const response = await api.get<ApiResponse<Referral[]>>('/customer/referrals');
    return response.data;
  },

  getMyReferralRewards: async (params?: ReferralRewardQueryParams): Promise<PaginatedResponse<ReferralReward>> => {
    const response = await api.get<PaginatedResponse<ReferralReward>>('/customer/referral-rewards', { params });
    return response.data;
  },

  acceptReferral: async (code: string): Promise<ApiResponse<Referral>> => {
    const response = await api.post<ApiResponse<Referral>>('/customer/referrals/accept', { code });
    return response.data;
  },

  validateReferralCode: async (code: string): Promise<ReferralValidation> => {
    const response = await api.get<ApiResponse<ReferralValidation>>(`/storefront/referral/${code}`);
    return response.data.data;
  },
};

export default referralService;

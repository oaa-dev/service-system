import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoyaltyCard,
  LoyaltyReward,
  ScanResult,
  LoyaltyCardQueryParams,
  LoyaltyRewardQueryParams,
} from '@/types/api';

const loyaltyService = {
  /**
   * Scan a QR code token to earn a stamp.
   * POST /customer/loyalty/scan
   */
  scanQr: async (token: string): Promise<ScanResult> => {
    const response = await api.post<ApiResponse<ScanResult>>('/customer/loyalty/scan', { token });
    return response.data.data;
  },

  /**
   * Fetch the authenticated customer's loyalty cards.
   * GET /customer/loyalty-cards
   */
  getMyCards: async (params?: LoyaltyCardQueryParams): Promise<PaginatedResponse<LoyaltyCard>> => {
    const response = await api.get<PaginatedResponse<LoyaltyCard>>('/customer/loyalty-cards', { params });
    return response.data;
  },

  /**
   * Fetch a single loyalty card with stamps and rewards.
   * GET /customer/loyalty-cards/{id}
   */
  getCardById: async (id: number): Promise<LoyaltyCard> => {
    const response = await api.get<ApiResponse<LoyaltyCard>>(`/customer/loyalty-cards/${id}`);
    return response.data.data;
  },

  /**
   * Fetch available (unredeemed) rewards for use at checkout.
   * GET /customer/loyalty-rewards
   */
  getMyRewards: async (params?: LoyaltyRewardQueryParams): Promise<PaginatedResponse<LoyaltyReward>> => {
    const response = await api.get<PaginatedResponse<LoyaltyReward>>('/customer/loyalty-rewards', { params });
    return response.data;
  },
};

export default loyaltyService;

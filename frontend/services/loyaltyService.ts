import api from '@/lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoyaltyProgram,
  LoyaltyCard,
  LoyaltyStampQrCode,
  CreateLoyaltyProgramRequest,
  GenerateLoyaltyQrRequest,
  AwardBonusStampRequest,
  LoyaltyCardQueryParams,
} from '@/types/api';

export const loyaltyService = {
  /**
   * Get the authenticated merchant's loyalty program.
   * Returns null (204) when no program exists yet.
   */
  getMyProgram: async (): Promise<LoyaltyProgram | null> => {
    const response = await api.get<ApiResponse<LoyaltyProgram>>('/auth/merchant/loyalty-program');
    return response.data.data ?? null;
  },

  /**
   * Create or update (upsert) the merchant's loyalty program.
   */
  upsertProgram: async (data: CreateLoyaltyProgramRequest): Promise<LoyaltyProgram> => {
    const response = await api.post<ApiResponse<LoyaltyProgram>>('/auth/merchant/loyalty-program', data);
    return response.data.data;
  },

  /**
   * Deactivate the merchant's loyalty program.
   */
  deactivateProgram: async (): Promise<void> => {
    await api.delete('/auth/merchant/loyalty-program');
  },

  /**
   * Generate a QR code stamp token for customers to scan.
   */
  generateQr: async (data: GenerateLoyaltyQrRequest): Promise<LoyaltyStampQrCode> => {
    const response = await api.post<ApiResponse<LoyaltyStampQrCode>>(
      '/auth/merchant/loyalty/generate-qr',
      data
    );
    return response.data.data;
  },

  /**
   * Get paginated list of customer loyalty cards for this merchant.
   */
  getLoyaltyCards: async (params?: LoyaltyCardQueryParams): Promise<PaginatedResponse<LoyaltyCard>> => {
    const response = await api.get<PaginatedResponse<LoyaltyCard>>('/auth/merchant/loyalty-cards', { params });
    return response.data;
  },

  /**
   * Get a single loyalty card with full stamp + reward history.
   */
  getLoyaltyCard: async (cardId: number): Promise<LoyaltyCard> => {
    const response = await api.get<ApiResponse<LoyaltyCard>>(`/auth/merchant/loyalty-cards/${cardId}`);
    return response.data.data;
  },

  /**
   * Award a bonus stamp to a customer's loyalty card.
   */
  awardBonusStamp: async (cardId: number, data?: AwardBonusStampRequest): Promise<LoyaltyCard> => {
    const response = await api.post<ApiResponse<LoyaltyCard>>(
      `/auth/merchant/loyalty-cards/${cardId}/stamp`,
      data ?? {}
    );
    return response.data.data;
  },
};

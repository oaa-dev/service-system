import api from '@/lib/axios';
import type { Advertisement } from '@/types/api';

const advertisementService = {
  /**
   * Fetch active advertisements for a given placement slot.
   * GET /storefront/advertisements?placement=X
   */
  getActiveAds: async (placement: string): Promise<Advertisement[]> => {
    const response = await api.get<{ data: Advertisement[] }>('/storefront/advertisements', {
      params: { placement },
    });
    return response.data.data;
  },

  /**
   * Record an impression for an advertisement.
   * POST /advertisements/{id}/impression
   */
  trackImpression: async (id: number): Promise<void> => {
    await api.post(`/advertisements/${id}/impression`);
  },

  /**
   * Record a click for an advertisement.
   * POST /advertisements/{id}/click
   */
  trackClick: async (id: number): Promise<void> => {
    await api.post(`/advertisements/${id}/click`);
  },
};

export default advertisementService;

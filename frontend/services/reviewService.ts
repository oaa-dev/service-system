import api from '@/lib/axios';
import type { PaginatedResponse, Review, ReviewQueryParams, MerchantReviewQueryParams } from '@/types/api';

export const reviewService = {
  /**
   * Admin: list all reviews across the platform (filterable by merchant, rating, publish state)
   */
  getReviews: async (params?: ReviewQueryParams): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>('/reviews', { params });
    return response.data;
  },

  /**
   * Admin: toggle a review's published/unpublished state
   */
  togglePublish: async (reviewId: number): Promise<Review> => {
    const response = await api.patch<{ success: boolean; data: Review }>(`/reviews/${reviewId}/toggle-publish`);
    return response.data.data;
  },

  /**
   * Admin: update internal notes on a review
   */
  updateNotes: async (reviewId: number, adminNotes: string): Promise<Review> => {
    const response = await api.put<{ success: boolean; data: Review }>(`/reviews/${reviewId}/notes`, {
      admin_notes: adminNotes,
    });
    return response.data.data;
  },

  /**
   * Merchant self-service: list own merchant's reviews
   */
  getMyMerchantReviews: async (params?: MerchantReviewQueryParams): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>('/auth/merchant/reviews', { params });
    return response.data;
  },

  /**
   * Merchant self-service: post a reply to a review
   */
  replyToReview: async (reviewId: number, reply: string): Promise<Review> => {
    const response = await api.post<{ success: boolean; data: Review }>(
      `/auth/merchant/reviews/${reviewId}/reply`,
      { reply }
    );
    return response.data.data;
  },

  /**
   * Merchant self-service: update an existing reply
   */
  updateReply: async (reviewId: number, reply: string): Promise<Review> => {
    const response = await api.put<{ success: boolean; data: Review }>(
      `/auth/merchant/reviews/${reviewId}/reply`,
      { reply }
    );
    return response.data.data;
  },

  /**
   * Merchant self-service: delete a reply from a review
   */
  deleteReply: async (reviewId: number): Promise<void> => {
    await api.delete(`/auth/merchant/reviews/${reviewId}/reply`);
  },
};

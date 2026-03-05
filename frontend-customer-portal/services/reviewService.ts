import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, Review } from '@/types/api';

export interface CreateReviewData {
  rating: number;
  title?: string | null;
  comment?: string | null;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string | null;
  comment?: string | null;
}

export interface ReviewQueryParams {
  page?: number;
  per_page?: number;
}

const reviewService = {
  getPublicReviews: async (slug: string, params?: ReviewQueryParams): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>(
      `/storefront/merchants/${slug}/reviews`,
      { params },
    );
    return response.data;
  },

  createReview: async (merchantId: number, data: CreateReviewData): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>(
      `/customer/merchants/${merchantId}/reviews`,
      data,
    );
    return response.data.data;
  },

  updateReview: async (reviewId: number, data: UpdateReviewData): Promise<Review> => {
    const response = await api.put<ApiResponse<Review>>(
      `/customer/reviews/${reviewId}`,
      data,
    );
    return response.data.data;
  },

  deleteReview: async (reviewId: number): Promise<void> => {
    await api.delete(`/customer/reviews/${reviewId}`);
  },

  getMyReviews: async (params?: ReviewQueryParams): Promise<PaginatedResponse<Review>> => {
    const response = await api.get<PaginatedResponse<Review>>(
      '/customer/reviews',
      { params },
    );
    return response.data;
  },
};

export default reviewService;

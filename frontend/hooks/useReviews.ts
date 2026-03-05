import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { ApiError, MerchantReviewQueryParams, ReviewQueryParams } from '@/types/api';
import { AxiosError } from 'axios';

// ─── Admin hooks ────────────────────────────────────────────────────────────

/**
 * Paginated list of all reviews across the platform.
 * Supports filtering by merchant_id, rating, and is_published.
 */
export function useReviews(params?: ReviewQueryParams) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewService.getReviews(params),
  });
}

/**
 * Toggle a review's published state (admin).
 * Invalidates both the admin reviews list and the merchant reviews list.
 */
export function useToggleReviewPublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewService.togglePublish(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-reviews'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Toggle review publish failed:', error.response?.data?.message);
    },
  });
}

/**
 * Update internal admin notes on a review.
 */
export function useUpdateReviewNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, adminNotes }: { reviewId: number; adminNotes: string }) =>
      reviewService.updateNotes(reviewId, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update review notes failed:', error.response?.data?.message);
    },
  });
}

// ─── Merchant self-service hooks ─────────────────────────────────────────────

/**
 * Paginated list of the authenticated merchant's reviews.
 * Supports filtering by is_published and rating.
 */
export function useMyMerchantReviews(params?: MerchantReviewQueryParams) {
  return useQuery({
    queryKey: ['merchant-reviews', params],
    queryFn: () => reviewService.getMyMerchantReviews(params),
  });
}

/**
 * Post a new reply to a review on the merchant's own store.
 */
export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) =>
      reviewService.replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-reviews'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Reply to review failed:', error.response?.data?.message);
    },
  });
}

/**
 * Update the merchant's existing reply on a review.
 */
export function useUpdateReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) =>
      reviewService.updateReply(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-reviews'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update reply failed:', error.response?.data?.message);
    },
  });
}

/**
 * Delete the merchant's reply from a review.
 */
export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewService.deleteReply(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-reviews'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete reply failed:', error.response?.data?.message);
    },
  });
}

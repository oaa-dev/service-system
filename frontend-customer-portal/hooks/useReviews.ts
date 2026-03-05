import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import reviewService, { CreateReviewData, UpdateReviewData } from '@/services/reviewService';

export function usePublicReviews(slug: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['storefront', 'merchants', slug, 'reviews', params],
    queryFn: () => reviewService.getPublicReviews(slug, params),
    enabled: !!slug,
  });
}

export function useMyReviews(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['customer', 'reviews', params],
    queryFn: () => reviewService.getMyReviews(params),
  });
}

export function useCreateReview(merchantId: number, merchantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewData) => reviewService.createReview(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'merchants', merchantSlug, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
    },
  });
}

export function useUpdateReview(merchantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: number; data: UpdateReviewData }) =>
      reviewService.updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'merchants', merchantSlug, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
    },
  });
}

export function useDeleteReview(merchantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'merchants', merchantSlug, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { couponService } from '@/services/couponService';
import type { ApiError, CouponQueryParams, CreateCouponRequest, UpdateCouponRequest, ValidateCouponRequest } from '@/types/api';
import { AxiosError } from 'axios';

// ─── Admin hooks ────────────────────────────────────────────────────────────

export function useCoupons(params?: CouponQueryParams) {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: () => couponService.getCoupons(params),
  });
}

export function useCoupon(id: number) {
  return useQuery({
    queryKey: ['coupons', id],
    queryFn: () => couponService.getCoupon(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create coupon failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponRequest }) =>
      couponService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update coupon failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete coupon failed:', error.response?.data?.message);
    },
  });
}

// ─── Merchant self-service hooks ─────────────────────────────────────────────

export function useMyCoupons(params?: CouponQueryParams) {
  return useQuery({
    queryKey: ['my-coupons', params],
    queryFn: () => couponService.getMyCoupons(params),
  });
}

export function useCreateMyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponService.createMyCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create coupon failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateMyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponRequest }) =>
      couponService.updateMyCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update coupon failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteMyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => couponService.deleteMyCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete coupon failed:', error.response?.data?.message);
    },
  });
}

// ─── Public hooks ────────────────────────────────────────────────────────────

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (data: ValidateCouponRequest) => couponService.validateCoupon(data),
    onError: (error: AxiosError<ApiError>) => {
      console.error('Validate coupon failed:', error.response?.data?.message);
    },
  });
}

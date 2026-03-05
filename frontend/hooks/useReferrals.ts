import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { referralService } from '@/services/referralService';
import type {
  ApiError,
  CreateReferralProgramRequest,
  ReferralQueryParams,
} from '@/types/api';

// ─── Query keys ─────────────────────────────────────────────────────────────

export const referralKeys = {
  program: ['referral-program'] as const,
  referrals: (params?: ReferralQueryParams) => ['referrals', params] as const,
  stats: ['referral-stats'] as const,
  adminProgram: (merchantId: number) => ['admin-referral-program', merchantId] as const,
};

// ─── Referral Program ─────────────────────────────────────────────────────────

export function useMyReferralProgram() {
  return useQuery({
    queryKey: referralKeys.program,
    queryFn: () => referralService.getMyReferralProgram(),
    retry: (failureCount, error: AxiosError) => {
      const status = error?.response?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 3;
    },
  });
}

export function useCreateOrUpdateReferralProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralProgramRequest) =>
      referralService.createOrUpdateReferralProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.program });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Save referral program failed:', error.response?.data?.message);
    },
  });
}

export function useDeactivateReferralProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => referralService.deactivateReferralProgram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.program });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Deactivate referral program failed:', error.response?.data?.message);
    },
  });
}

// ─── Referrals List ───────────────────────────────────────────────────────────

export function useMerchantReferrals(params?: ReferralQueryParams) {
  return useQuery({
    queryKey: referralKeys.referrals(params),
    queryFn: () => referralService.getMerchantReferrals(params),
    placeholderData: (prev) => prev,
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useReferralStats() {
  return useQuery({
    queryKey: referralKeys.stats,
    queryFn: () => referralService.getReferralStats(),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminReferralProgram(merchantId: number) {
  return useQuery({
    queryKey: referralKeys.adminProgram(merchantId),
    queryFn: () => referralService.getAdminReferralProgram(merchantId),
    enabled: !!merchantId,
    retry: (failureCount, error: AxiosError) => {
      const status = error?.response?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 3;
    },
  });
}

export function useUpdateAdminReferralProgram(merchantId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralProgramRequest) =>
      referralService.updateAdminReferralProgram(merchantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.adminProgram(merchantId) });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update admin referral program failed:', error.response?.data?.message);
    },
  });
}

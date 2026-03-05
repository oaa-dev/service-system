import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import referralService from '@/services/referralService';
import type { ReferralRewardQueryParams } from '@/types/api';

export function useMyReferralCodes() {
  return useQuery({
    queryKey: ['customer', 'referral-codes'],
    queryFn: () => referralService.getMyReferralCodes(),
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: ['customer', 'referrals'],
    queryFn: () => referralService.getMyReferrals(),
  });
}

export function useMyReferralRewards(params?: ReferralRewardQueryParams) {
  return useQuery({
    queryKey: ['customer', 'referral-rewards', params],
    queryFn: () => referralService.getMyReferralRewards(params),
    placeholderData: keepPreviousData,
  });
}

export function useGenerateReferralCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (merchantId: number) => referralService.generateReferralCode(merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'referral-codes'] });
    },
  });
}

export function useAcceptReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => referralService.acceptReferral(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'referrals'] });
    },
  });
}

export function useValidateReferralCode(code: string) {
  return useQuery({
    queryKey: ['storefront', 'referral', code],
    queryFn: () => referralService.validateReferralCode(code),
    enabled: code.trim().length > 0,
  });
}

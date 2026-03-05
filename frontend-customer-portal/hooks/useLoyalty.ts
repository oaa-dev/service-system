import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import loyaltyService from '@/services/loyaltyService';
import type { LoyaltyCardQueryParams, LoyaltyRewardQueryParams } from '@/types/api';

export function useMyLoyaltyCards(params?: LoyaltyCardQueryParams) {
  return useQuery({
    queryKey: ['customer', 'loyalty-cards', params],
    queryFn: () => loyaltyService.getMyCards(params),
    placeholderData: keepPreviousData,
  });
}

export function useLoyaltyCard(id: number | null) {
  return useQuery({
    queryKey: ['customer', 'loyalty-cards', id],
    queryFn: () => loyaltyService.getCardById(id!),
    enabled: id !== null && id > 0,
  });
}

export function useMyLoyaltyRewards(params?: LoyaltyRewardQueryParams) {
  return useQuery({
    queryKey: ['customer', 'loyalty-rewards', params],
    queryFn: () => loyaltyService.getMyRewards(params),
    placeholderData: keepPreviousData,
  });
}

export function useScanLoyaltyQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => loyaltyService.scanQr(token),
    onSuccess: () => {
      // Invalidate both cards and rewards so data is fresh after a scan
      queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty-cards'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty-rewards'] });
    },
  });
}

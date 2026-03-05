import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { loyaltyService } from '@/services/loyaltyService';
import type {
  ApiError,
  CreateLoyaltyProgramRequest,
  GenerateLoyaltyQrRequest,
  AwardBonusStampRequest,
  LoyaltyCardQueryParams,
} from '@/types/api';

// ─── Query keys ─────────────────────────────────────────────────────────────

export const loyaltyKeys = {
  program: ['loyalty-program'] as const,
  cards: (params?: LoyaltyCardQueryParams) => ['loyalty-cards', params] as const,
  card: (id: number) => ['loyalty-cards', id] as const,
};

// ─── Loyalty Program ─────────────────────────────────────────────────────────

/**
 * Fetch the authenticated merchant's loyalty program.
 * Returns null when no program has been created yet.
 */
export function useMyLoyaltyProgram() {
  return useQuery({
    queryKey: loyaltyKeys.program,
    queryFn: () => loyaltyService.getMyProgram(),
    // 404 from the API means no program yet — treat null as a valid "empty" state
    retry: (failureCount, error: AxiosError) => {
      const status = error?.response?.status;
      if (status === 404 || status === 401 || status === 403) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Create or update the merchant's loyalty program (upsert).
 * On success invalidates the program cache.
 */
export function useUpsertLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoyaltyProgramRequest) => loyaltyService.upsertProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Upsert loyalty program failed:', error.response?.data?.message);
    },
  });
}

/**
 * Deactivate (soft-delete) the merchant's loyalty program.
 */
export function useDeactivateLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => loyaltyService.deactivateProgram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Deactivate loyalty program failed:', error.response?.data?.message);
    },
  });
}

// ─── QR Codes ────────────────────────────────────────────────────────────────

/**
 * Generate a new QR stamp code.
 * Does NOT cache the result in React Query — the QR is managed via local state
 * in the QrGenerator component because it has countdown/timer behaviour.
 */
export function useGenerateLoyaltyQr() {
  return useMutation({
    mutationFn: (data: GenerateLoyaltyQrRequest) => loyaltyService.generateQr(data),
    onError: (error: AxiosError<ApiError>) => {
      console.error('Generate loyalty QR failed:', error.response?.data?.message);
    },
  });
}

// ─── Loyalty Cards ───────────────────────────────────────────────────────────

/**
 * Paginated list of customer loyalty cards for the authenticated merchant.
 */
export function useLoyaltyCards(params?: LoyaltyCardQueryParams) {
  return useQuery({
    queryKey: loyaltyKeys.cards(params),
    queryFn: () => loyaltyService.getLoyaltyCards(params),
  });
}

/**
 * Single loyalty card with full stamp + reward history.
 */
export function useLoyaltyCard(cardId: number) {
  return useQuery({
    queryKey: loyaltyKeys.card(cardId),
    queryFn: () => loyaltyService.getLoyaltyCard(cardId),
    enabled: !!cardId,
  });
}

/**
 * Award a manual bonus stamp to a customer's loyalty card.
 * On success invalidates the card detail and the cards list.
 */
export function useAwardBonusStamp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: number; data?: AwardBonusStampRequest }) =>
      loyaltyService.awardBonusStamp(cardId, data),
    onSuccess: (_, { cardId }) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.card(cardId) });
      queryClient.invalidateQueries({ queryKey: ['loyalty-cards'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Award bonus stamp failed:', error.response?.data?.message);
    },
  });
}

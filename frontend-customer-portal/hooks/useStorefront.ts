import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { storefrontService, StorefrontMerchantParams, StorefrontServiceParams } from '@/services/storefrontService';

export function useStorefrontMerchants(params?: StorefrontMerchantParams) {
  return useQuery({
    queryKey: ['storefront', 'merchants', params],
    queryFn: () => storefrontService.getMerchants(params),
    placeholderData: keepPreviousData,
  });
}

export function useMerchantBySlug(slug: string) {
  return useQuery({
    queryKey: ['storefront', 'merchants', slug],
    queryFn: () => storefrontService.getMerchantBySlug(slug),
    enabled: !!slug,
  });
}

export function useMerchantBranches(slug: string) {
  return useQuery({
    queryKey: ['storefront', 'merchants', slug, 'branches'],
    queryFn: () => storefrontService.getMerchantBranches(slug),
    enabled: !!slug,
  });
}

export function useMerchantServices(slug: string, params?: StorefrontServiceParams) {
  return useQuery({
    queryKey: ['storefront', 'merchants', slug, 'services', params],
    queryFn: () => storefrontService.getMerchantServices(slug, params),
    enabled: !!slug,
    placeholderData: keepPreviousData,
  });
}

export function useServiceDetail(slug: string, serviceId: number) {
  return useQuery({
    queryKey: ['storefront', 'merchants', slug, 'services', serviceId],
    queryFn: () => storefrontService.getServiceDetail(slug, serviceId),
    enabled: !!slug && !!serviceId,
  });
}

export function useStorefrontBusinessTypes() {
  return useQuery({
    queryKey: ['storefront', 'businessTypes'],
    queryFn: () => storefrontService.getBusinessTypes(),
    staleTime: Infinity,
  });
}

export function useStorefrontPaymentMethods() {
  return useQuery({
    queryKey: ['storefront', 'paymentMethods'],
    queryFn: () => storefrontService.getPaymentMethods(),
    staleTime: Infinity,
  });
}

export function useStorefrontMapMerchants(
  enabled = true,
  params?: { lat?: number; lng?: number; radius?: number },
) {
  return useQuery({
    queryKey: ['storefront', 'merchants', 'map', params],
    queryFn: async () => {
      const response = await storefrontService.getMapMerchants(params);
      return response.data;
    },
    staleTime: 60000,
    enabled,
  });
}

export function useBookingAvailability(slug: string, serviceId: number | null, month: string) {
  return useQuery({
    queryKey: ['storefront', 'booking-availability', slug, serviceId, month],
    queryFn: () => storefrontService.getBookingAvailability(slug, serviceId!, month),
    enabled: !!slug && !!serviceId && !!month,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });
}

export function useReservationAvailability(slug: string, serviceId: number | null, month: string) {
  return useQuery({
    queryKey: ['storefront', 'reservation-availability', slug, serviceId, month],
    queryFn: () => storefrontService.getReservationAvailability(slug, serviceId!, month),
    enabled: !!slug && !!serviceId && !!month,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });
}

export function useBookingSlotAvailability(
  slug: string | null,
  serviceId: number | null,
  date: string | null,
) {
  return useQuery({
    queryKey: ['storefront', slug, 'services', serviceId, 'slot-availability', date],
    queryFn: () => storefrontService.getBookingSlotAvailability(slug!, serviceId!, date!),
    enabled: !!slug && !!serviceId && !!date,
  });
}

export function useActivePlatformFees() {
  return useQuery({
    queryKey: ['storefront', 'platformFees'],
    queryFn: () => storefrontService.getActivePlatformFees(),
    staleTime: Infinity,
  });
}

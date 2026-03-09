import { useQuery } from '@tanstack/react-query';
import advertisementService from '@/services/advertisementService';

/**
 * Fetch active advertisements for a given placement slot.
 * Caches for 5 minutes — ads don't change frequently.
 */
export function useActiveAds(placement: string) {
  return useQuery({
    queryKey: ['advertisements', placement],
    queryFn: () => advertisementService.getActiveAds(placement),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

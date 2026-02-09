import { useQuery } from '@tanstack/react-query';
import { geographicService } from '@/services/geographicService';

export function useRegions() {
  return useQuery({
    queryKey: ['geographic', 'regions'],
    queryFn: geographicService.getRegions,
    staleTime: Infinity,
  });
}

export function useProvinces(regionId: number | null | undefined) {
  return useQuery({
    queryKey: ['geographic', 'provinces', regionId],
    queryFn: () => geographicService.getProvinces(regionId!),
    enabled: !!regionId,
    staleTime: Infinity,
  });
}

export function useCities(provinceId: number | null | undefined) {
  return useQuery({
    queryKey: ['geographic', 'cities', provinceId],
    queryFn: () => geographicService.getCities(provinceId!),
    enabled: !!provinceId,
    staleTime: Infinity,
  });
}

export function useBarangays(cityId: number | null | undefined) {
  return useQuery({
    queryKey: ['geographic', 'barangays', cityId],
    queryFn: () => geographicService.getBarangays(cityId!),
    enabled: !!cityId,
    staleTime: Infinity,
  });
}

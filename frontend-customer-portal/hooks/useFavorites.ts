import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerFavoriteService, MyFavoriteParams } from '@/services/customerFavoriteService';

export function useMyFavorites(params?: MyFavoriteParams) {
  return useQuery({
    queryKey: ['customer', 'favorites', params],
    queryFn: () => customerFavoriteService.getMyFavorites(params),
    placeholderData: keepPreviousData,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (merchantId: number) => customerFavoriteService.toggleFavorite(merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'favorites'] });
      queryClient.invalidateQueries({ queryKey: ['storefront', 'merchants'] });
    },
  });
}

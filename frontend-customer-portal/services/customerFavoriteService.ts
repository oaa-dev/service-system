import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse, Merchant } from '@/types/api';

export interface MyFavoriteParams {
  page?: number;
  per_page?: number;
  'filter[search]'?: string;
  sort?: string;
}

export const customerFavoriteService = {
  toggleFavorite: (merchantId: number) =>
    api.post<ApiResponse<{ is_favorited: boolean }>>(`/customer/my/favorite-merchants/${merchantId}`).then(r => r.data),
  getMyFavorites: (params?: MyFavoriteParams) =>
    api.get<PaginatedResponse<Merchant>>('/customer/my/favorite-merchants', { params }).then(r => r.data),
};

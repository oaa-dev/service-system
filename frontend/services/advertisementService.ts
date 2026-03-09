import api from '@/lib/axios';
import type {
  Advertisement,
  AdvertisementQueryParams,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
  PaginatedResponse,
} from '@/types/api';

export const advertisementService = {
  getAdvertisements: async (
    params?: AdvertisementQueryParams
  ): Promise<PaginatedResponse<Advertisement>> => {
    const response = await api.get<PaginatedResponse<Advertisement>>(
      '/advertisements',
      { params }
    );
    return response.data;
  },

  getAdvertisement: async (id: number): Promise<Advertisement> => {
    const response = await api.get<{ success: boolean; data: Advertisement }>(
      `/advertisements/${id}`
    );
    return response.data.data;
  },

  createAdvertisement: async (
    data: CreateAdvertisementRequest
  ): Promise<Advertisement> => {
    const response = await api.post<{ success: boolean; data: Advertisement }>(
      '/advertisements',
      data
    );
    return response.data.data;
  },

  updateAdvertisement: async (
    id: number,
    data: UpdateAdvertisementRequest
  ): Promise<Advertisement> => {
    const response = await api.put<{ success: boolean; data: Advertisement }>(
      `/advertisements/${id}`,
      data
    );
    return response.data.data;
  },

  deleteAdvertisement: async (id: number): Promise<void> => {
    await api.delete(`/advertisements/${id}`);
  },

  uploadAdImage: async (id: number, file: File): Promise<Advertisement> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<{ success: boolean; data: Advertisement }>(
      `/advertisements/${id}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  deleteAdImage: async (id: number): Promise<void> => {
    await api.delete(`/advertisements/${id}/image`);
  },
};

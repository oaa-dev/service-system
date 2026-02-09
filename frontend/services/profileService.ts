import api from '@/lib/axios';
import { ApiResponse, Profile, UpdateProfileRequest } from '@/types/api';

export const profileService = {
  /**
   * Get current user's profile
   */
  get: async (): Promise<ApiResponse<Profile>> => {
    const response = await api.get<ApiResponse<Profile>>('/profile');
    return response.data;
  },

  /**
   * Update current user's profile
   */
  update: async (data: UpdateProfileRequest): Promise<ApiResponse<Profile>> => {
    const response = await api.put<ApiResponse<Profile>>('/profile', data);
    return response.data;
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<ApiResponse<Profile>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<Profile>>('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete avatar image
   */
  deleteAvatar: async (): Promise<ApiResponse<Profile>> => {
    const response = await api.delete<ApiResponse<Profile>>('/profile/avatar');
    return response.data;
  },
};

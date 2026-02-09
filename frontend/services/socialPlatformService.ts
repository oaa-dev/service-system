import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  SocialPlatform,
  CreateSocialPlatformRequest,
  UpdateSocialPlatformRequest,
  SocialPlatformQueryParams,
} from '@/types/api';

export const socialPlatformService = {
  getAll: async (params?: SocialPlatformQueryParams): Promise<PaginatedResponse<SocialPlatform>> => {
    const response = await api.get<PaginatedResponse<SocialPlatform>>('/social-platforms', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<SocialPlatform[]>> => {
    const response = await api.get<ApiResponse<SocialPlatform[]>>('/social-platforms/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<SocialPlatform[]>> => {
    const response = await api.get<ApiResponse<SocialPlatform[]>>('/social-platforms/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<SocialPlatform>> => {
    const response = await api.get<ApiResponse<SocialPlatform>>(`/social-platforms/${id}`);
    return response.data;
  },

  create: async (data: CreateSocialPlatformRequest): Promise<ApiResponse<SocialPlatform>> => {
    const response = await api.post<ApiResponse<SocialPlatform>>('/social-platforms', data);
    return response.data;
  },

  update: async (id: number, data: UpdateSocialPlatformRequest): Promise<ApiResponse<SocialPlatform>> => {
    const response = await api.put<ApiResponse<SocialPlatform>>(`/social-platforms/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/social-platforms/${id}`);
    return response.data;
  },
};

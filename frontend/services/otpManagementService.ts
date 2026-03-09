import api from '@/lib/axios';
import { ApiResponse, PaginatedResponse, OtpVerification, OtpVerificationQueryParams } from '@/types/api';

export const otpManagementService = {
  getAll: async (params?: OtpVerificationQueryParams): Promise<PaginatedResponse<OtpVerification>> => {
    const response = await api.get<PaginatedResponse<OtpVerification>>('/otp-management', { params });
    return response.data;
  },
  getById: async (id: number): Promise<ApiResponse<OtpVerification>> => {
    const response = await api.get<ApiResponse<OtpVerification>>(`/otp-management/${id}`);
    return response.data;
  },
  verifyUser: async (id: number): Promise<ApiResponse<OtpVerification>> => {
    const response = await api.post<ApiResponse<OtpVerification>>(`/otp-management/${id}/verify`);
    return response.data;
  },
  unlockUser: async (id: number): Promise<ApiResponse<OtpVerification>> => {
    const response = await api.post<ApiResponse<OtpVerification>>(`/otp-management/${id}/unlock`);
    return response.data;
  },
};

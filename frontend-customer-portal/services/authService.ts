import api from '@/lib/axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, VerificationStatusResponse } from '@/types/api';

export const authService = {
  register: async (data: Omit<RegisterRequest, 'role'>): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { ...data, role: 'customer' });
    return response.data;
  },
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },
  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
  verifyOtp: async (data: { otp: string }): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/verify-otp', data);
    return response.data;
  },
  resendOtp: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/resend-otp');
    return response.data;
  },
  getVerificationStatus: async (): Promise<ApiResponse<VerificationStatusResponse>> => {
    const response = await api.get<ApiResponse<VerificationStatusResponse>>('/auth/verification-status');
    return response.data;
  },
};

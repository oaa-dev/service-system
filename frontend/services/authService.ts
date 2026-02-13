import api from '@/lib/axios';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  Merchant,
  RegisterRequest,
  UpdateAuthUserRequest,
  User,
  VerificationStatusResponse,
} from '@/types/api';

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  /**
   * Update current authenticated user
   */
  updateMe: async (data: UpdateAuthUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>('/auth/me', data);
    return response.data;
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (data: { otp: string }): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/verify-otp', data);
    return response.data;
  },

  /**
   * Resend OTP code
   */
  resendOtp: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/resend-otp');
    return response.data;
  },

  /**
   * Get verification status
   */
  getVerificationStatus: async (): Promise<ApiResponse<VerificationStatusResponse>> => {
    const response = await api.get<ApiResponse<VerificationStatusResponse>>('/auth/verification-status');
    return response.data;
  },

  /**
   * Select merchant type during onboarding
   */
  selectMerchantType: async (data: { type: string; name: string }): Promise<ApiResponse<{ user: User; merchant: Merchant }>> => {
    const response = await api.post<ApiResponse<{ user: User; merchant: Merchant }>>('/auth/select-merchant-type', data);
    return response.data;
  },
};

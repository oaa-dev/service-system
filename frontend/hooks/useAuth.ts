import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import {
  LoginRequest,
  RegisterRequest,
  UpdateAuthUserRequest,
} from '@/types/api';

/**
 * Hook for user registration
 */
export function useRegister() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: () => {
      // Error handling is done in the form component via form.setError()
    },
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: () => {
      // Error handling is done in the form component via form.setError()
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      // Still logout locally even if API call fails
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Hook to get current authenticated user
 */
export function useMe() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authService.me();
      setUser(response.data);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to update current authenticated user
 */
export function useUpdateMe() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAuthUserRequest) => authService.updateMe(data),
    onSuccess: (response) => {
      setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: () => {
      // Error handling is done in the form component via form.setError()
    },
  });
}

/**
 * Hook to verify OTP
 */
export function useVerifyOtp() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { otp: string }) => authService.verifyOtp(data),
    onSuccess: (response) => {
      if (response.data) {
        setUser(response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to resend OTP
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: () => authService.resendOtp(),
  });
}

/**
 * Hook to get verification status
 */
export function useVerificationStatus() {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'verification-status'],
    queryFn: async () => {
      const response = await authService.getVerificationStatus();
      return response.data;
    },
    enabled: isAuthenticated && !user?.email_verified_at,
    staleTime: 30 * 1000,
    retry: false,
  });
}

/**
 * Hook to select merchant type during onboarding
 */
export function useSelectMerchantType() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: string; name: string }) => authService.selectMerchantType(data),
    onSuccess: (response) => {
      if (response.data?.user) setUser(response.data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

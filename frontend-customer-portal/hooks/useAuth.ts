import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { LoginRequest, RegisterRequest } from '@/types/api';

export function useRegister() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RegisterRequest, 'role'>) => authService.register(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      setAuth(response.data.user, response.data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => { logout(); queryClient.clear(); },
    onError: () => { logout(); queryClient.clear(); },
  });
}

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
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useVerifyOtp() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { otp: string }) => authService.verifyOtp(data),
    onSuccess: (response) => {
      if (response.data) setUser(response.data);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: () => authService.resendOtp(),
  });
}

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

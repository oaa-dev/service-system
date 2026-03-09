import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { otpManagementService } from '@/services/otpManagementService';
import { OtpVerificationQueryParams } from '@/types/api';

export function useOtpVerifications(params?: OtpVerificationQueryParams) {
  return useQuery({
    queryKey: ['otpVerifications', params],
    queryFn: () => otpManagementService.getAll(params),
  });
}

export function useVerifyUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => otpManagementService.verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otpVerifications'] });
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => otpManagementService.unlockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otpVerifications'] });
    },
  });
}

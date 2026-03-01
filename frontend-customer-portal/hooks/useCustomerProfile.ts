import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  getMyCustomerRecord,
  updateMyPreferences,
  getMyPaymentMethods,
  updateMyPaymentPreference,
  uploadIdentityDocument,
} from '@/services/customerProfileService';
import { UpdateProfilePayload, ChangePasswordPayload, UpdatePreferencesPayload } from '@/types/api';

export function useMyProfile() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => getMyProfile(),
  });
}

export function useMyCustomerRecord() {
  return useQuery({
    queryKey: ['customer', 'record'],
    queryFn: () => getMyCustomerRecord(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UpdateProfilePayload>) => updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => changePassword(data),
  });
}

export function useUpdateMyPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferencesPayload) => updateMyPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'record'] });
    },
  });
}

export function useMyPaymentMethods() {
  return useQuery({
    queryKey: ['customer', 'paymentMethods'],
    queryFn: () => getMyPaymentMethods(),
  });
}

export function useUpdateMyPaymentPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferredMethod: string | null) => updateMyPaymentPreference(preferredMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'record'] });
    },
  });
}

export function useUploadIdentityDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadIdentityDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'record'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

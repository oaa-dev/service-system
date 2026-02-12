import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { customerService } from '@/services/customerService';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  UpdateCustomerStatusRequest,
  SyncCustomerTagsRequest,
  CustomerQueryParams,
  CreateCustomerInteractionRequest,
  CustomerInteractionQueryParams,
  UpdateCustomerPreferencesRequest,
  UpdateCustomerProfileRequest,
  UpdateCustomerAccountRequest,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useCustomers(params?: CustomerQueryParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getAll(params),
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create customer failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerRequest }) =>
      customerService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete customer failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerStatusRequest }) =>
      customerService.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer status failed:', error.response?.data?.message);
    },
  });
}

export function useSyncCustomerTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncCustomerTagsRequest }) =>
      customerService.syncTags(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Sync customer tags failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCustomerAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerAccountRequest }) =>
      customerService.updateAccount(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer account failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerProfileRequest }) =>
      customerService.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer profile failed:', error.response?.data?.message);
    },
  });
}

// Avatar hooks

export function useUploadCustomerAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      customerService.uploadAvatar(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

export function useDeleteCustomerAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerService.deleteAvatar(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

// Document hooks

export function useUploadCustomerDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentTypeId, file, notes }: { id: number; documentTypeId: number; file: File; notes?: string }) =>
      customerService.uploadDocument(id, documentTypeId, file, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
    },
  });
}

export function useDeleteCustomerDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, documentId }: { customerId: number; documentId: number }) =>
      customerService.deleteDocument(customerId, documentId),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
    },
  });
}

// Interaction hooks

export function useCustomerInteractions(customerId: number, params?: CustomerInteractionQueryParams) {
  return useQuery({
    queryKey: ['customers', customerId, 'interactions', params],
    queryFn: () => customerService.getInteractions(customerId, params),
    enabled: !!customerId,
  });
}

export function useCreateCustomerInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number; data: CreateCustomerInteractionRequest }) =>
      customerService.createInteraction(customerId, data),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create interaction failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteCustomerInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, interactionId }: { customerId: number; interactionId: number }) =>
      customerService.deleteInteraction(customerId, interactionId),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId, 'interactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete interaction failed:', error.response?.data?.message);
    },
  });
}

// Self-service hooks

export function useCustomerProfile() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['profile', 'customer'],
    queryFn: () => customerService.getOwnProfile(),
    enabled: isAuthenticated,
  });
}

export function useUpdateCustomerPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCustomerPreferencesRequest) => customerService.updateOwnPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'customer'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer preferences failed:', error.response?.data?.message);
    },
  });
}

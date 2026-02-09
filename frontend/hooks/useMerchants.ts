import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { merchantService } from '@/services/merchantService';
import {
  CreateMerchantRequest,
  UpdateMerchantRequest,
  UpdateMerchantAccountRequest,
  UpdateMerchantStatusRequest,
  MerchantQueryParams,
  UpdateBusinessHoursRequest,
  SyncPaymentMethodsRequest,
  SyncSocialLinksRequest,
  GalleryCollection,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useMerchants(params?: MerchantQueryParams) {
  return useQuery({
    queryKey: ['merchants', params],
    queryFn: () => merchantService.getAll(params),
  });
}

export function useAllMerchants() {
  return useQuery({
    queryKey: ['merchants', 'all'],
    queryFn: () => merchantService.getAllUnpaginated(),
  });
}

export function useMerchant(id: number) {
  return useQuery({
    queryKey: ['merchants', id],
    queryFn: () => merchantService.getById(id),
    enabled: !!id,
  });
}

export function useCreateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMerchantRequest) => merchantService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create merchant failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMerchantRequest }) =>
      merchantService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update merchant failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateMerchantAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMerchantAccountRequest }) =>
      merchantService.updateAccount(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update merchant account failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => merchantService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete merchant failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMerchantStatusRequest }) =>
      merchantService.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update merchant status failed:', error.response?.data?.message);
    },
  });
}

export function useUploadMerchantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      merchantService.uploadLogo(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useDeleteMerchantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => merchantService.deleteLogo(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBusinessHoursRequest }) =>
      merchantService.updateBusinessHours(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useSyncMerchantPaymentMethods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncPaymentMethodsRequest }) =>
      merchantService.syncPaymentMethods(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useSyncMerchantSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncSocialLinksRequest }) =>
      merchantService.syncSocialLinks(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useUploadMerchantDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentTypeId, file, notes }: { id: number; documentTypeId: number; file: File; notes?: string }) =>
      merchantService.uploadDocument(id, documentTypeId, file, notes),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id] });
    },
  });
}

export function useDeleteMerchantDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, documentId }: { merchantId: number; documentId: number }) =>
      merchantService.deleteDocument(merchantId, documentId),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId] });
    },
  });
}

export function useMerchantGallery(id: number) {
  return useQuery({
    queryKey: ['merchants', id, 'gallery'],
    queryFn: () => merchantService.getGallery(id),
    enabled: !!id,
  });
}

export function useUploadGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, collection, file }: { id: number; collection: GalleryCollection; file: File }) =>
      merchantService.uploadGalleryImage(id, collection, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', id, 'gallery'] });
    },
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, mediaId }: { merchantId: number; mediaId: number }) =>
      merchantService.deleteGalleryImage(merchantId, mediaId),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'gallery'] });
    },
  });
}

// Merchant Service hooks

export function useMerchantServices(merchantId: number, params?: ServiceQueryParams) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'services', params],
    queryFn: () => merchantService.getServices(merchantId, params),
    enabled: !!merchantId,
  });
}

export function useMerchantService(merchantId: number, serviceId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'services', serviceId],
    queryFn: () => merchantService.getServiceById(merchantId, serviceId),
    enabled: !!merchantId && !!serviceId,
  });
}

export function useCreateMerchantService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: number; data: CreateServiceRequest }) =>
      merchantService.createService(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create service failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateMerchantService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, serviceId, data }: { merchantId: number; serviceId: number; data: UpdateServiceRequest }) =>
      merchantService.updateService(merchantId, serviceId, data),
    onSuccess: (_, { merchantId, serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services', serviceId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update service failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteMerchantService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, serviceId }: { merchantId: number; serviceId: number }) =>
      merchantService.deleteService(merchantId, serviceId),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete service failed:', error.response?.data?.message);
    },
  });
}

export function useUploadServiceImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, serviceId, file }: { merchantId: number; serviceId: number; file: File }) =>
      merchantService.uploadServiceImage(merchantId, serviceId, file),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services'] });
    },
  });
}

export function useDeleteServiceImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, serviceId }: { merchantId: number; serviceId: number }) =>
      merchantService.deleteServiceImage(merchantId, serviceId),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'services'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { myMerchantService } from '@/services/myMerchantService';
import {
  UpdateMerchantRequest,
  UpdateBusinessHoursRequest,
  SyncPaymentMethodsRequest,
  SyncSocialLinksRequest,
  StoreBranchRequest,
  UpdateBranchRequest,
  BranchQueryParams,
} from '@/types/api';

export function useMyMerchant() {
  return useQuery({
    queryKey: ['my-merchant'],
    queryFn: async () => {
      const response = await myMerchantService.getMyMerchant();
      return response.data;
    },
  });
}

export function useMyMerchantStats() {
  return useQuery({
    queryKey: ['my-merchant', 'stats'],
    queryFn: async () => {
      const response = await myMerchantService.getStats();
      return response.data;
    },
    refetchInterval: 60000,
  });
}

export function useUpdateMyMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMerchantRequest) => myMerchantService.updateMyMerchant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUploadMyMerchantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => myMerchantService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useDeleteMyMerchantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => myMerchantService.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useUpdateMyBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBusinessHoursRequest) => myMerchantService.updateBusinessHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useSyncMyPaymentMethods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SyncPaymentMethodsRequest) => myMerchantService.syncPaymentMethods(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useSyncMySocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SyncSocialLinksRequest) => myMerchantService.syncSocialLinks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useUploadMyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentTypeId, notes }: { file: File; documentTypeId: number; notes?: string }) =>
      myMerchantService.uploadDocument(file, documentTypeId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useDeleteMyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => myMerchantService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
    },
  });
}

export function useMyMerchantGallery() {
  return useQuery({
    queryKey: ['my-merchant', 'gallery'],
    queryFn: async () => {
      const response = await myMerchantService.getGallery();
      return response.data;
    },
  });
}

export function useUploadMyGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collection, file }: { collection: string; file: File }) =>
      myMerchantService.uploadGalleryImage(collection, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'gallery'] });
    },
  });
}

export function useDeleteMyGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => myMerchantService.deleteGalleryImage(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'gallery'] });
    },
  });
}

export function useMyMerchantStatusLogs() {
  return useQuery({
    queryKey: ['my-merchant', 'status-logs'],
    queryFn: async () => {
      const response = await myMerchantService.getStatusLogs();
      return response.data;
    },
  });
}

export function useMyOnboardingChecklist() {
  return useQuery({
    queryKey: ['my-merchant', 'onboarding-checklist'],
    queryFn: async () => {
      const response = await myMerchantService.getOnboardingChecklist();
      return response.data;
    },
  });
}

export function useSubmitMyApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => myMerchantService.submitApplication(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant'] });
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'onboarding-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'status-logs'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

// Branch hooks
export function useMyBranches(params?: BranchQueryParams) {
  return useQuery({
    queryKey: ['my-merchant', 'branches', params],
    queryFn: async () => {
      const response = await myMerchantService.getBranches(params);
      return response;
    },
  });
}

export function useMyBranch(branchId: number) {
  return useQuery({
    queryKey: ['my-merchant', 'branches', branchId],
    queryFn: async () => {
      const response = await myMerchantService.getBranch(branchId);
      return response.data;
    },
    enabled: branchId > 0,
  });
}

export function useCreateMyBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreBranchRequest) => myMerchantService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branches'] });
    },
  });
}

export function useUpdateMyBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number; data: UpdateBranchRequest }) =>
      myMerchantService.updateBranch(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branches'] });
    },
  });
}

export function useDeleteMyBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: number) => myMerchantService.deleteBranch(branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branches'] });
    },
  });
}

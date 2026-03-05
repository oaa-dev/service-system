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

// Branch detail management hooks (org managing a specific branch's settings/gallery)
export function useBranchDetail(branchId: number) {
  return useQuery({
    queryKey: ['my-merchant', 'branch-detail', branchId],
    queryFn: async () => {
      const response = await myMerchantService.getBranchDetail(branchId);
      return response.data;
    },
    enabled: branchId > 0,
  });
}

export function useUpdateBranchDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number; data: UpdateMerchantRequest }) =>
      myMerchantService.updateBranchDetails(branchId, data),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branches'] });
    },
  });
}

export function useUploadBranchLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, file }: { branchId: number; file: File }) =>
      myMerchantService.uploadBranchLogo(branchId, file),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
    },
  });
}

export function useDeleteBranchLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: number) => myMerchantService.deleteBranchLogo(branchId),
    onSuccess: (_, branchId) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
    },
  });
}

export function useBranchGallery(branchId: number) {
  return useQuery({
    queryKey: ['my-merchant', 'branch-detail', branchId, 'gallery'],
    queryFn: async () => {
      const response = await myMerchantService.getBranchGallery(branchId);
      return response.data;
    },
    enabled: branchId > 0,
  });
}

export function useUploadBranchGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, collection, file }: { branchId: number; collection: string; file: File }) =>
      myMerchantService.uploadBranchGalleryImage(branchId, collection, file),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId, 'gallery'] });
    },
  });
}

export function useDeleteBranchGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, mediaId }: { branchId: number; mediaId: number }) =>
      myMerchantService.deleteBranchGalleryImage(branchId, mediaId),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId, 'gallery'] });
    },
  });
}

export function useUpdateBranchBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number; data: UpdateBusinessHoursRequest }) =>
      myMerchantService.updateBranchBusinessHours(branchId, data),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
    },
  });
}

export function useSyncBranchPaymentMethods() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number; data: SyncPaymentMethodsRequest }) =>
      myMerchantService.syncBranchPaymentMethods(branchId, data),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
    },
  });
}

export function useSyncBranchSocialLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, data }: { branchId: number; data: SyncSocialLinksRequest }) =>
      myMerchantService.syncBranchSocialLinks(branchId, data),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-merchant', 'branch-detail', branchId] });
    },
  });
}

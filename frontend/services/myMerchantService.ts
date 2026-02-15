import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Merchant,
  MerchantStats,
  UpdateMerchantRequest,
  UpdateBusinessHoursRequest,
  SyncPaymentMethodsRequest,
  SyncSocialLinksRequest,
  MerchantBusinessHour,
  MerchantSocialLink,
  MerchantDocument,
  PaymentMethod,
  MerchantGallery,
  GalleryImage,
  MerchantStatusLog,
  OnboardingChecklist,
  StoreBranchRequest,
  UpdateBranchRequest,
  BranchQueryParams,
} from '@/types/api';

export const myMerchantService = {
  // Merchant CRUD
  getMyMerchant: async (): Promise<ApiResponse<Merchant>> => {
    const response = await api.get<ApiResponse<Merchant>>('/auth/merchant');
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<MerchantStats>> => {
    const response = await api.get<ApiResponse<MerchantStats>>('/auth/merchant/stats');
    return response.data;
  },

  updateMyMerchant: async (data: UpdateMerchantRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.put<ApiResponse<Merchant>>('/auth/merchant', data);
    return response.data;
  },

  // Logo
  uploadLogo: async (file: File): Promise<ApiResponse<Merchant>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<ApiResponse<Merchant>>('/auth/merchant/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteLogo: async (): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>('/auth/merchant/logo');
    return response.data;
  },

  // Business hours
  updateBusinessHours: async (data: UpdateBusinessHoursRequest): Promise<ApiResponse<MerchantBusinessHour[]>> => {
    const response = await api.put<ApiResponse<MerchantBusinessHour[]>>('/auth/merchant/business-hours', data);
    return response.data;
  },

  // Payment methods
  syncPaymentMethods: async (data: SyncPaymentMethodsRequest): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.post<ApiResponse<PaymentMethod[]>>('/auth/merchant/payment-methods', data);
    return response.data;
  },

  // Social links
  syncSocialLinks: async (data: SyncSocialLinksRequest): Promise<ApiResponse<MerchantSocialLink[]>> => {
    const response = await api.post<ApiResponse<MerchantSocialLink[]>>('/auth/merchant/social-links', data);
    return response.data;
  },

  // Documents
  uploadDocument: async (file: File, documentTypeId: number, notes?: string): Promise<ApiResponse<MerchantDocument>> => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type_id', documentTypeId.toString());
    if (notes) formData.append('notes', notes);
    const response = await api.post<ApiResponse<MerchantDocument>>('/auth/merchant/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteDocument: async (documentId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/auth/merchant/documents/${documentId}`);
    return response.data;
  },

  // Gallery
  getGallery: async (): Promise<ApiResponse<MerchantGallery>> => {
    const response = await api.get<ApiResponse<MerchantGallery>>('/auth/merchant/gallery');
    return response.data;
  },

  uploadGalleryImage: async (collection: string, file: File): Promise<ApiResponse<GalleryImage>> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse<GalleryImage>>(`/auth/merchant/gallery/${collection}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteGalleryImage: async (mediaId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/auth/merchant/gallery/${mediaId}`);
    return response.data;
  },

  // Status logs
  getStatusLogs: async (): Promise<ApiResponse<MerchantStatusLog[]>> => {
    const response = await api.get<ApiResponse<MerchantStatusLog[]>>('/auth/merchant/status-logs');
    return response.data;
  },

  // Onboarding checklist
  getOnboardingChecklist: async (): Promise<ApiResponse<OnboardingChecklist>> => {
    const response = await api.get<ApiResponse<OnboardingChecklist>>('/auth/merchant/onboarding-checklist');
    return response.data;
  },

  // Submit application
  submitApplication: async (): Promise<ApiResponse<Merchant>> => {
    const response = await api.post<ApiResponse<Merchant>>('/auth/merchant/submit-application');
    return response.data;
  },

  // Branches
  getBranches: async (params?: BranchQueryParams): Promise<PaginatedResponse<Merchant>> => {
    const response = await api.get<PaginatedResponse<Merchant>>('/auth/merchant/branches', { params });
    return response.data;
  },

  getBranch: async (branchId: number): Promise<ApiResponse<Merchant>> => {
    const response = await api.get<ApiResponse<Merchant>>(`/auth/merchant/branches/${branchId}`);
    return response.data;
  },

  createBranch: async (data: StoreBranchRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.post<ApiResponse<Merchant>>('/auth/merchant/branches', data);
    return response.data;
  },

  updateBranch: async (branchId: number, data: UpdateBranchRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.put<ApiResponse<Merchant>>(`/auth/merchant/branches/${branchId}`, data);
    return response.data;
  },

  deleteBranch: async (branchId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/auth/merchant/branches/${branchId}`);
    return response.data;
  },
};

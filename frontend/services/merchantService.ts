import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Merchant,
  CreateMerchantRequest,
  UpdateMerchantRequest,
  UpdateMerchantAccountRequest,
  UpdateMerchantStatusRequest,
  MerchantQueryParams,
  MerchantBusinessHour,
  UpdateBusinessHoursRequest,
  PaymentMethod,
  SyncPaymentMethodsRequest,
  MerchantSocialLink,
  SyncSocialLinksRequest,
  MerchantDocument,
  MerchantGallery,
  GalleryImage,
  GalleryCollection,
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceQueryParams,
} from '@/types/api';

export const merchantService = {
  getAll: async (params?: MerchantQueryParams): Promise<PaginatedResponse<Merchant>> => {
    const response = await api.get<PaginatedResponse<Merchant>>('/merchants', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<Merchant[]>> => {
    const response = await api.get<ApiResponse<Merchant[]>>('/merchants/all');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Merchant>> => {
    const response = await api.get<ApiResponse<Merchant>>(`/merchants/${id}`);
    return response.data;
  },

  create: async (data: CreateMerchantRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.post<ApiResponse<Merchant>>('/merchants', data);
    return response.data;
  },

  update: async (id: number, data: UpdateMerchantRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.put<ApiResponse<Merchant>>(`/merchants/${id}`, data);
    return response.data;
  },

  updateAccount: async (id: number, data: UpdateMerchantAccountRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.put<ApiResponse<Merchant>>(`/merchants/${id}/account`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateMerchantStatusRequest): Promise<ApiResponse<Merchant>> => {
    const response = await api.patch<ApiResponse<Merchant>>(`/merchants/${id}/status`, data);
    return response.data;
  },

  uploadLogo: async (id: number, file: File): Promise<ApiResponse<Merchant>> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<ApiResponse<Merchant>>(`/merchants/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteLogo: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${id}/logo`);
    return response.data;
  },

  updateBusinessHours: async (id: number, data: UpdateBusinessHoursRequest): Promise<ApiResponse<MerchantBusinessHour[]>> => {
    const response = await api.put<ApiResponse<MerchantBusinessHour[]>>(`/merchants/${id}/business-hours`, data);
    return response.data;
  },

  syncPaymentMethods: async (id: number, data: SyncPaymentMethodsRequest): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await api.post<ApiResponse<PaymentMethod[]>>(`/merchants/${id}/payment-methods`, data);
    return response.data;
  },

  syncSocialLinks: async (id: number, data: SyncSocialLinksRequest): Promise<ApiResponse<MerchantSocialLink[]>> => {
    const response = await api.post<ApiResponse<MerchantSocialLink[]>>(`/merchants/${id}/social-links`, data);
    return response.data;
  },

  uploadDocument: async (id: number, documentTypeId: number, file: File, notes?: string): Promise<ApiResponse<MerchantDocument>> => {
    const formData = new FormData();
    formData.append('document_type_id', String(documentTypeId));
    formData.append('document', file);
    if (notes) formData.append('notes', notes);
    const response = await api.post<ApiResponse<MerchantDocument>>(`/merchants/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteDocument: async (merchantId: number, documentId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${merchantId}/documents/${documentId}`);
    return response.data;
  },

  getGallery: async (id: number): Promise<ApiResponse<MerchantGallery>> => {
    const response = await api.get<ApiResponse<MerchantGallery>>(`/merchants/${id}/gallery`);
    return response.data;
  },

  uploadGalleryImage: async (id: number, collection: GalleryCollection, file: File): Promise<ApiResponse<GalleryImage>> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse<GalleryImage>>(`/merchants/${id}/gallery/${collection}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteGalleryImage: async (merchantId: number, mediaId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${merchantId}/gallery/${mediaId}`);
    return response.data;
  },

  // Service methods
  getServices: async (merchantId: number, params?: ServiceQueryParams): Promise<PaginatedResponse<Service>> => {
    const response = await api.get<PaginatedResponse<Service>>(`/merchants/${merchantId}/services`, { params });
    return response.data;
  },

  getServiceById: async (merchantId: number, serviceId: number): Promise<ApiResponse<Service>> => {
    const response = await api.get<ApiResponse<Service>>(`/merchants/${merchantId}/services/${serviceId}`);
    return response.data;
  },

  createService: async (merchantId: number, data: CreateServiceRequest): Promise<ApiResponse<Service>> => {
    const response = await api.post<ApiResponse<Service>>(`/merchants/${merchantId}/services`, data);
    return response.data;
  },

  updateService: async (merchantId: number, serviceId: number, data: UpdateServiceRequest): Promise<ApiResponse<Service>> => {
    const response = await api.put<ApiResponse<Service>>(`/merchants/${merchantId}/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (merchantId: number, serviceId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${merchantId}/services/${serviceId}`);
    return response.data;
  },

  uploadServiceImage: async (merchantId: number, serviceId: number, file: File): Promise<ApiResponse<Service>> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post<ApiResponse<Service>>(`/merchants/${merchantId}/services/${serviceId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteServiceImage: async (merchantId: number, serviceId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/merchants/${merchantId}/services/${serviceId}/image`);
    return response.data;
  },
};

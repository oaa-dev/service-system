import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  UpdateCustomerStatusRequest,
  SyncCustomerTagsRequest,
  CustomerQueryParams,
  CustomerInteraction,
  CreateCustomerInteractionRequest,
  CustomerInteractionQueryParams,
  UpdateCustomerPreferencesRequest,
  UpdateCustomerProfileRequest,
  UpdateCustomerAccountRequest,
  CustomerDocument,
} from '@/types/api';

export const customerService = {
  getAll: async (params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<PaginatedResponse<Customer>>('/customers', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  update: async (id: number, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/customers/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateCustomerStatusRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/status`, data);
    return response.data;
  },

  syncTags: async (id: number, data: SyncCustomerTagsRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>(`/customers/${id}/tags`, data);
    return response.data;
  },

  // Interaction endpoints
  getInteractions: async (customerId: number, params?: CustomerInteractionQueryParams): Promise<PaginatedResponse<CustomerInteraction>> => {
    const response = await api.get<PaginatedResponse<CustomerInteraction>>(`/customers/${customerId}/interactions`, { params });
    return response.data;
  },

  createInteraction: async (customerId: number, data: CreateCustomerInteractionRequest): Promise<ApiResponse<CustomerInteraction>> => {
    const response = await api.post<ApiResponse<CustomerInteraction>>(`/customers/${customerId}/interactions`, data);
    return response.data;
  },

  deleteInteraction: async (customerId: number, interactionId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/customers/${customerId}/interactions/${interactionId}`);
    return response.data;
  },

  // Admin account update
  updateAccount: async (id: number, data: UpdateCustomerAccountRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}/account`, data);
    return response.data;
  },

  // Admin profile update
  updateProfile: async (id: number, data: UpdateCustomerProfileRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}/profile`, data);
    return response.data;
  },

  // Avatar endpoints
  uploadAvatar: async (id: number, file: File): Promise<ApiResponse<Customer>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<ApiResponse<Customer>>(`/customers/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAvatar: async (id: number): Promise<ApiResponse<Customer>> => {
    const response = await api.delete<ApiResponse<Customer>>(`/customers/${id}/avatar`);
    return response.data;
  },

  // Document endpoints
  uploadDocument: async (id: number, documentTypeId: number, file: File, notes?: string): Promise<ApiResponse<CustomerDocument>> => {
    const formData = new FormData();
    formData.append('document_type_id', String(documentTypeId));
    formData.append('document', file);
    if (notes) formData.append('notes', notes);
    const response = await api.post<ApiResponse<CustomerDocument>>(`/customers/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteDocument: async (customerId: number, documentId: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/customers/${customerId}/documents/${documentId}`);
    return response.data;
  },

  // Self-service (profile) endpoints
  getOwnProfile: async (): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>('/profile/customer');
    return response.data;
  },

  updateOwnPreferences: async (data: UpdateCustomerPreferencesRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>('/profile/customer', data);
    return response.data;
  },
};

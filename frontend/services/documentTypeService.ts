import api from '@/lib/axios';
import {
  ApiResponse,
  PaginatedResponse,
  DocumentType,
  CreateDocumentTypeRequest,
  UpdateDocumentTypeRequest,
  DocumentTypeQueryParams,
} from '@/types/api';

export const documentTypeService = {
  getAll: async (params?: DocumentTypeQueryParams): Promise<PaginatedResponse<DocumentType>> => {
    const response = await api.get<PaginatedResponse<DocumentType>>('/document-types', { params });
    return response.data;
  },

  getAllUnpaginated: async (): Promise<ApiResponse<DocumentType[]>> => {
    const response = await api.get<ApiResponse<DocumentType[]>>('/document-types/all');
    return response.data;
  },

  getActive: async (): Promise<ApiResponse<DocumentType[]>> => {
    const response = await api.get<ApiResponse<DocumentType[]>>('/document-types/active');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<DocumentType>> => {
    const response = await api.get<ApiResponse<DocumentType>>(`/document-types/${id}`);
    return response.data;
  },

  create: async (data: CreateDocumentTypeRequest): Promise<ApiResponse<DocumentType>> => {
    const response = await api.post<ApiResponse<DocumentType>>('/document-types', data);
    return response.data;
  },

  update: async (id: number, data: UpdateDocumentTypeRequest): Promise<ApiResponse<DocumentType>> => {
    const response = await api.put<ApiResponse<DocumentType>>(`/document-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/document-types/${id}`);
    return response.data;
  },
};

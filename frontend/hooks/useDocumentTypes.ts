import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentTypeService } from '@/services/documentTypeService';
import {
  CreateDocumentTypeRequest,
  UpdateDocumentTypeRequest,
  DocumentTypeQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useDocumentTypes(params?: DocumentTypeQueryParams) {
  return useQuery({
    queryKey: ['documentTypes', params],
    queryFn: () => documentTypeService.getAll(params),
  });
}

export function useAllDocumentTypes() {
  return useQuery({
    queryKey: ['documentTypes', 'all'],
    queryFn: () => documentTypeService.getAllUnpaginated(),
  });
}

export function useActiveDocumentTypes() {
  return useQuery({
    queryKey: ['documentTypes', 'active'],
    queryFn: () => documentTypeService.getActive(),
  });
}

export function useDocumentType(id: number) {
  return useQuery({
    queryKey: ['documentTypes', id],
    queryFn: () => documentTypeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentTypeRequest) => documentTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create document type failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDocumentTypeRequest }) =>
      documentTypeService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
      queryClient.invalidateQueries({ queryKey: ['documentTypes', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update document type failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete document type failed:', error.response?.data?.message);
    },
  });
}

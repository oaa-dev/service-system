import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { businessTypeService } from '@/services/businessTypeService';
import {
  CreateBusinessTypeRequest,
  UpdateBusinessTypeRequest,
  BusinessTypeQueryParams,
  SyncBusinessTypeFieldsRequest,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useBusinessTypes(params?: BusinessTypeQueryParams) {
  return useQuery({
    queryKey: ['businessTypes', params],
    queryFn: () => businessTypeService.getAll(params),
  });
}

export function useAllBusinessTypes() {
  return useQuery({
    queryKey: ['businessTypes', 'all'],
    queryFn: () => businessTypeService.getAllUnpaginated(),
  });
}

export function useActiveBusinessTypes() {
  return useQuery({
    queryKey: ['businessTypes', 'active'],
    queryFn: () => businessTypeService.getActive(),
  });
}

export function useBusinessType(id: number) {
  return useQuery({
    queryKey: ['businessTypes', id],
    queryFn: () => businessTypeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBusinessTypeRequest) => businessTypeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessTypes'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create business type failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBusinessTypeRequest }) =>
      businessTypeService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['businessTypes'] });
      queryClient.invalidateQueries({ queryKey: ['businessTypes', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update business type failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteBusinessType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => businessTypeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessTypes'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete business type failed:', error.response?.data?.message);
    },
  });
}

export function useBusinessTypeFields(businessTypeId: number | null) {
  return useQuery({
    queryKey: ['businessTypes', businessTypeId, 'fields'],
    queryFn: () => businessTypeService.getFields(businessTypeId!),
    enabled: !!businessTypeId,
  });
}

export function useSyncBusinessTypeFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ businessTypeId, data }: { businessTypeId: number; data: SyncBusinessTypeFieldsRequest }) =>
      businessTypeService.syncFields(businessTypeId, data),
    onSuccess: (_, { businessTypeId }) => {
      queryClient.invalidateQueries({ queryKey: ['businessTypes'] });
      queryClient.invalidateQueries({ queryKey: ['businessTypes', businessTypeId, 'fields'] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerTagService } from '@/services/customerTagService';
import {
  CreateCustomerTagRequest,
  UpdateCustomerTagRequest,
  CustomerTagQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useCustomerTags(params?: CustomerTagQueryParams) {
  return useQuery({
    queryKey: ['customerTags', params],
    queryFn: () => customerTagService.getAll(params),
  });
}

export function useAllCustomerTags() {
  return useQuery({
    queryKey: ['customerTags', 'all'],
    queryFn: () => customerTagService.getAllUnpaginated(),
  });
}

export function useActiveCustomerTags() {
  return useQuery({
    queryKey: ['customerTags', 'active'],
    queryFn: () => customerTagService.getActive(),
  });
}

export function useCustomerTag(id: number) {
  return useQuery({
    queryKey: ['customerTags', id],
    queryFn: () => customerTagService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCustomerTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerTagRequest) => customerTagService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTags'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create customer tag failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateCustomerTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerTagRequest }) =>
      customerTagService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customerTags'] });
      queryClient.invalidateQueries({ queryKey: ['customerTags', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update customer tag failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteCustomerTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerTagService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTags'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete customer tag failed:', error.response?.data?.message);
    },
  });
}

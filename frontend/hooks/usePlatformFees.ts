import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { platformFeeService } from '@/services/platformFeeService';
import {
  CreatePlatformFeeRequest,
  UpdatePlatformFeeRequest,
  PlatformFeeQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function usePlatformFees(params?: PlatformFeeQueryParams) {
  return useQuery({
    queryKey: ['platformFees', params],
    queryFn: () => platformFeeService.getAll(params),
  });
}

export function useAllPlatformFees() {
  return useQuery({
    queryKey: ['platformFees', 'all'],
    queryFn: () => platformFeeService.getAllUnpaginated(),
  });
}

export function useActivePlatformFees() {
  return useQuery({
    queryKey: ['platformFees', 'active'],
    queryFn: () => platformFeeService.getActive(),
  });
}

export function usePlatformFee(id: number) {
  return useQuery({
    queryKey: ['platformFees', id],
    queryFn: () => platformFeeService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePlatformFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlatformFeeRequest) => platformFeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformFees'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create platform fee failed:', error.response?.data?.message);
    },
  });
}

export function useUpdatePlatformFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlatformFeeRequest }) =>
      platformFeeService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['platformFees'] });
      queryClient.invalidateQueries({ queryKey: ['platformFees', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update platform fee failed:', error.response?.data?.message);
    },
  });
}

export function useDeletePlatformFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => platformFeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformFees'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete platform fee failed:', error.response?.data?.message);
    },
  });
}

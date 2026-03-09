import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advertisementService } from '@/services/advertisementService';
import type {
  ApiError,
  AdvertisementQueryParams,
  CreateAdvertisementRequest,
  UpdateAdvertisementRequest,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useAdvertisements(params?: AdvertisementQueryParams) {
  return useQuery({
    queryKey: ['advertisements', params],
    queryFn: () => advertisementService.getAdvertisements(params),
  });
}

export function useAdvertisement(id: number) {
  return useQuery({
    queryKey: ['advertisements', id],
    queryFn: () => advertisementService.getAdvertisement(id),
    enabled: !!id,
  });
}

export function useCreateAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdvertisementRequest) =>
      advertisementService.createAdvertisement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create advertisement failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAdvertisementRequest }) =>
      advertisementService.updateAdvertisement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update advertisement failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteAdvertisement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => advertisementService.deleteAdvertisement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete advertisement failed:', error.response?.data?.message);
    },
  });
}

export function useUploadAdImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      advertisementService.uploadAdImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Upload ad image failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteAdImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => advertisementService.deleteAdImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete ad image failed:', error.response?.data?.message);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialPlatformService } from '@/services/socialPlatformService';
import {
  CreateSocialPlatformRequest,
  UpdateSocialPlatformRequest,
  SocialPlatformQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useSocialPlatforms(params?: SocialPlatformQueryParams) {
  return useQuery({
    queryKey: ['socialPlatforms', params],
    queryFn: () => socialPlatformService.getAll(params),
  });
}

export function useAllSocialPlatforms() {
  return useQuery({
    queryKey: ['socialPlatforms', 'all'],
    queryFn: () => socialPlatformService.getAllUnpaginated(),
  });
}

export function useActiveSocialPlatforms() {
  return useQuery({
    queryKey: ['socialPlatforms', 'active'],
    queryFn: () => socialPlatformService.getActive(),
  });
}

export function useSocialPlatform(id: number) {
  return useQuery({
    queryKey: ['socialPlatforms', id],
    queryFn: () => socialPlatformService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSocialPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSocialPlatformRequest) => socialPlatformService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPlatforms'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create social platform failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateSocialPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSocialPlatformRequest }) =>
      socialPlatformService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['socialPlatforms'] });
      queryClient.invalidateQueries({ queryKey: ['socialPlatforms', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update social platform failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteSocialPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => socialPlatformService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPlatforms'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete social platform failed:', error.response?.data?.message);
    },
  });
}

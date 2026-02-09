import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceCategoryService } from '@/services/serviceCategoryService';
import {
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
  ServiceCategoryQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useServiceCategories(merchantId: number, params?: ServiceCategoryQueryParams) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceCategories', params],
    queryFn: () => serviceCategoryService.getAll(merchantId, params),
    enabled: !!merchantId,
  });
}

export function useAllServiceCategories(merchantId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceCategories', 'all'],
    queryFn: () => serviceCategoryService.getAllUnpaginated(merchantId),
    enabled: !!merchantId,
  });
}

export function useActiveServiceCategories(merchantId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceCategories', 'active'],
    queryFn: () => serviceCategoryService.getActive(merchantId),
    enabled: !!merchantId,
  });
}

export function useServiceCategory(merchantId: number, id: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceCategories', id],
    queryFn: () => serviceCategoryService.getById(merchantId, id),
    enabled: !!merchantId && !!id,
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: number; data: CreateServiceCategoryRequest }) =>
      serviceCategoryService.create(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceCategories'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create service category failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, id, data }: { merchantId: number; id: number; data: UpdateServiceCategoryRequest }) =>
      serviceCategoryService.update(merchantId, id, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceCategories'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update service category failed:', error.response?.data?.message);
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, id }: { merchantId: number; id: number }) =>
      serviceCategoryService.delete(merchantId, id),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceCategories'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete service category failed:', error.response?.data?.message);
    },
  });
}

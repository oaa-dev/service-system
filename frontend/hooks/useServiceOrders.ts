import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceOrderService } from '@/services/serviceOrderService';
import {
  CreateServiceOrderRequest,
  UpdateServiceOrderStatusRequest,
  ServiceOrderQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useServiceOrders(merchantId: number, params?: ServiceOrderQueryParams) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceOrders', params],
    queryFn: () => serviceOrderService.getAll(merchantId, params),
    enabled: !!merchantId,
  });
}

export function useServiceOrder(merchantId: number, serviceOrderId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'serviceOrders', serviceOrderId],
    queryFn: () => serviceOrderService.getById(merchantId, serviceOrderId),
    enabled: !!merchantId && !!serviceOrderId,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: number; data: CreateServiceOrderRequest }) =>
      serviceOrderService.create(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceOrders'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create service order failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateServiceOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, serviceOrderId, data }: { merchantId: number; serviceOrderId: number; data: UpdateServiceOrderStatusRequest }) =>
      serviceOrderService.updateStatus(merchantId, serviceOrderId, data),
    onSuccess: (_, { merchantId, serviceOrderId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'serviceOrders', serviceOrderId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update service order status failed:', error.response?.data?.message);
    },
  });
}

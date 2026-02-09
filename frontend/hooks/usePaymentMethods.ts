import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentMethodService } from '@/services/paymentMethodService';
import {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function usePaymentMethods(params?: PaymentMethodQueryParams) {
  return useQuery({
    queryKey: ['paymentMethods', params],
    queryFn: () => paymentMethodService.getAll(params),
  });
}

export function useAllPaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods', 'all'],
    queryFn: () => paymentMethodService.getAllUnpaginated(),
  });
}

export function useActivePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods', 'active'],
    queryFn: () => paymentMethodService.getActive(),
  });
}

export function usePaymentMethod(id: number) {
  return useQuery({
    queryKey: ['paymentMethods', id],
    queryFn: () => paymentMethodService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentMethodRequest) => paymentMethodService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create payment method failed:', error.response?.data?.message);
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentMethodRequest }) =>
      paymentMethodService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update payment method failed:', error.response?.data?.message);
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentMethodService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete payment method failed:', error.response?.data?.message);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { MarkAsPaidRequest, RequestRefundRequest, ApiError } from '@/types/api';
import { AxiosError } from 'axios';

export function usePayment(id: number) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentService.getPayment(id),
    enabled: !!id,
  });
}

function invalidatePaymentAndRelated(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  queryClient.invalidateQueries({ queryKey: ['payments', id] });
  // Also invalidate booking/reservation/order lists so payment status badges update
  queryClient.invalidateQueries({ queryKey: ['merchants'], exact: false });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: MarkAsPaidRequest }) =>
      paymentService.markAsPaid(id, data),
    onSuccess: (_, { id }) => {
      invalidatePaymentAndRelated(queryClient, id);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Mark as paid failed:', error.response?.data?.message);
    },
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: RequestRefundRequest }) =>
      paymentService.requestRefund(id, data),
    onSuccess: (_, { id }) => {
      invalidatePaymentAndRelated(queryClient, id);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Request refund failed:', error.response?.data?.message);
    },
  });
}

export function useMarkRefunded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => paymentService.markRefunded(id),
    onSuccess: (_, { id }) => {
      invalidatePaymentAndRelated(queryClient, id);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Mark refunded failed:', error.response?.data?.message);
    },
  });
}

export function useCheckPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => paymentService.checkStatus(id),
    onSuccess: (_, { id }) => {
      invalidatePaymentAndRelated(queryClient, id);
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Check payment status failed:', error.response?.data?.message);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '@/services/reservationService';
import {
  CreateReservationRequest,
  UpdateReservationStatusRequest,
  ReservationQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useReservations(merchantId: number, params?: ReservationQueryParams) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'reservations', params],
    queryFn: () => reservationService.getAll(merchantId, params),
    enabled: !!merchantId,
  });
}

export function useReservation(merchantId: number, reservationId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'reservations', reservationId],
    queryFn: () => reservationService.getById(merchantId, reservationId),
    enabled: !!merchantId && !!reservationId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: number; data: CreateReservationRequest }) =>
      reservationService.create(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'reservations'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create reservation failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, reservationId, data }: { merchantId: number; reservationId: number; data: UpdateReservationStatusRequest }) =>
      reservationService.updateStatus(merchantId, reservationId, data),
    onSuccess: (_, { merchantId, reservationId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'reservations'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'reservations', reservationId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update reservation status failed:', error.response?.data?.message);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
import {
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  BookingQueryParams,
  ApiError,
} from '@/types/api';
import { AxiosError } from 'axios';

export function useBookings(merchantId: number, params?: BookingQueryParams) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'bookings', params],
    queryFn: () => bookingService.getAll(merchantId, params),
    enabled: !!merchantId,
  });
}

export function useBooking(merchantId: number, bookingId: number) {
  return useQuery({
    queryKey: ['merchants', merchantId, 'bookings', bookingId],
    queryFn: () => bookingService.getById(merchantId, bookingId),
    enabled: !!merchantId && !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: number; data: CreateBookingRequest }) =>
      bookingService.create(merchantId, data),
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'bookings'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create booking failed:', error.response?.data?.message);
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ merchantId, bookingId, data }: { merchantId: number; bookingId: number; data: UpdateBookingStatusRequest }) =>
      bookingService.updateStatus(merchantId, bookingId, data),
    onSuccess: (_, { merchantId, bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['merchants', merchantId, 'bookings', bookingId] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update booking status failed:', error.response?.data?.message);
    },
  });
}

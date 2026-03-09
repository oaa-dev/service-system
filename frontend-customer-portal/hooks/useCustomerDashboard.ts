import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerDashboardService, MyBookingParams, MyReservationParams, MyOrderParams } from '@/services/customerDashboardService';
import { customerActionService } from '@/services/customerActionService';

export function useMyStats() {
  return useQuery({
    queryKey: ['customer', 'stats'],
    queryFn: () => customerDashboardService.getMyStats(),
  });
}

export function useMyBookings(params?: MyBookingParams) {
  return useQuery({
    queryKey: ['customer', 'bookings', params],
    queryFn: () => customerDashboardService.getMyBookings(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyBooking(id: number) {
  return useQuery({
    queryKey: ['customer', 'bookings', id],
    queryFn: () => customerDashboardService.getMyBooking(id),
    enabled: !!id,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerDashboardService.cancelMyBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useMyReservations(params?: MyReservationParams) {
  return useQuery({
    queryKey: ['customer', 'reservations', params],
    queryFn: () => customerDashboardService.getMyReservations(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyReservation(id: number | null) {
  return useQuery({
    queryKey: ['customer', 'reservations', id],
    queryFn: () => customerDashboardService.getMyReservation(id!),
    enabled: !!id,
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerDashboardService.cancelMyReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useMyOrders(params?: MyOrderParams) {
  return useQuery({
    queryKey: ['customer', 'orders', params],
    queryFn: () => customerDashboardService.getMyOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyOrder(id: number | null) {
  return useQuery({
    queryKey: ['customer', 'orders', id],
    queryFn: () => customerDashboardService.getMyOrder(id!),
    enabled: !!id,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerDashboardService.cancelMyOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useCheckPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) => customerActionService.checkPaymentStatus(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'reservations'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
    },
  });
}

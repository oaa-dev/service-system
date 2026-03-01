import { useMutation } from '@tanstack/react-query';
import {
  customerActionService,
  CreateBookingPayload,
  CreateReservationPayload,
  CreateOrderPayload,
} from '@/services/customerActionService';

export function useCreateBooking(slug: string) {
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => customerActionService.createBooking(slug, data),
  });
}

export function useCreateReservation(slug: string) {
  return useMutation({
    mutationFn: (data: CreateReservationPayload) => customerActionService.createReservation(slug, data),
  });
}

export function useCreateOrder(slug: string) {
  return useMutation({
    mutationFn: (data: CreateOrderPayload) => customerActionService.createOrder(slug, data),
  });
}

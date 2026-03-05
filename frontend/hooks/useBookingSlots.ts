import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingSlotService } from '@/services/bookingSlotService';
import { MerchantBookingSlot } from '@/types/api';

export function useBookingSlots(merchantId?: number) {
  return useQuery({
    queryKey: ['booking-slots', merchantId ?? 'my'],
    queryFn: () => bookingSlotService.getAll(merchantId),
  });
}

export function useCreateBookingSlot(merchantId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MerchantBookingSlot>) =>
      bookingSlotService.create(data, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-slots', merchantId ?? 'my'] });
    },
  });
}

export function useUpdateBookingSlot(merchantId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: Partial<MerchantBookingSlot> }) =>
      bookingSlotService.update(slotId, data, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-slots', merchantId ?? 'my'] });
    },
  });
}

export function useDeleteBookingSlot(merchantId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: number) => bookingSlotService.delete(slotId, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-slots', merchantId ?? 'my'] });
    },
  });
}

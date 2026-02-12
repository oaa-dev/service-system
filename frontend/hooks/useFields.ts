'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldService } from '@/services/fieldService';
import type { CreateFieldRequest, UpdateFieldRequest, FieldQueryParams } from '@/types/api';

export function useFields(params?: FieldQueryParams) {
  return useQuery({
    queryKey: ['fields', params],
    queryFn: () => fieldService.getAll(params),
  });
}

export function useAllFields() {
  return useQuery({
    queryKey: ['fields', 'all'],
    queryFn: () => fieldService.getAllWithoutPagination(),
  });
}

export function useActiveFields() {
  return useQuery({
    queryKey: ['fields', 'active'],
    queryFn: () => fieldService.getActive(),
  });
}

export function useField(id: number) {
  return useQuery({
    queryKey: ['fields', id],
    queryFn: () => fieldService.getById(id),
    enabled: !!id,
  });
}

export function useCreateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFieldRequest) => fieldService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}

export function useUpdateField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFieldRequest }) =>
      fieldService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}

export function useDeleteField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fieldService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
  });
}

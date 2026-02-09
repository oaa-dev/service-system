import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/roleService';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  SyncPermissionsRequest,
  RoleQueryParams,
} from '@/types/api';

export const useRoles = (params?: RoleQueryParams) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params),
  });
};

export const useAllRoles = () => {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => roleService.getAllUnpaginated(),
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleRequest) => roleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) =>
      roleService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useSyncPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncPermissionsRequest }) =>
      roleService.syncPermissions(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
    },
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
  });
};

export const usePermissionsGrouped = () => {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: () => roleService.getPermissionsGrouped(),
  });
};

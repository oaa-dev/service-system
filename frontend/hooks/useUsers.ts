import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  ApiError,
  SyncRolesRequest,
} from '@/types/api';
import { AxiosError } from 'axios';

/**
 * Hook to get paginated list of users
 */
export function useUsers(params?: UserQueryParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single user by ID
 */
export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Create user failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Update user failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Delete user failed:', error.response?.data?.message);
    },
  });
}

/**
 * Hook to sync user roles
 */
export function useSyncUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SyncRolesRequest }) =>
      userService.syncRoles(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error('Sync roles failed:', error.response?.data?.message);
    },
  });
}

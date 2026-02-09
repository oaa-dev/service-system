import { useAuthStore } from '@/stores/authStore';

/**
 * Hook for checking permissions in components
 */
export const usePermission = () => {
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission, hasAllPermissions, user } =
    useAuthStore();

  return {
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: user?.roles?.includes('super-admin') ?? false,
    isAdmin: user?.roles?.includes('admin') ?? false,
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
  };
};

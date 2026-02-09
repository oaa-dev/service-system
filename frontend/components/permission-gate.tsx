'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;
  fallback?: ReactNode;
}

/**
 * Component for conditional rendering based on permissions/roles
 *
 * Usage:
 * <PermissionGate permission="users.create">
 *   <CreateUserButton />
 * </PermissionGate>
 *
 * <PermissionGate permissions={['users.create', 'users.update']} requireAll>
 *   <UserManagement />
 * </PermissionGate>
 *
 * <PermissionGate role="admin">
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  requireAllRoles = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } =
    usePermission();

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    if (requireAll) {
      if (!hasAllPermissions(permissions)) {
        return <>{fallback}</>;
      }
    } else {
      if (!hasAnyPermission(permissions)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check single role
  if (role) {
    if (!hasRole(role)) {
      return <>{fallback}</>;
    }
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    if (requireAllRoles) {
      const hasAllRoles = roles.every((r) => hasRole(r));
      if (!hasAllRoles) {
        return <>{fallback}</>;
      }
    } else {
      if (!hasAnyRole(roles)) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
}

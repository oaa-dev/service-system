import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuth: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  // Permission helpers
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isMerchantUser: () => boolean;
  isBranchMerchant: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: (token) =>
        set({
          token,
          isAuthenticated: !!token,
        }),

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      // Permission helpers
      hasRole: (role: string) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
      },

      hasAnyRole: (roles: string[]) => {
        const { user } = get();
        return roles.some((role) => user?.roles?.includes(role)) ?? false;
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        // Super-admin has all permissions
        if (user?.roles?.includes('super-admin')) return true;
        return user?.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        // Super-admin has all permissions
        if (user?.roles?.includes('super-admin')) return true;
        return permissions.some((p) => user?.permissions?.includes(p)) ?? false;
      },

      hasAllPermissions: (permissions: string[]) => {
        const { user } = get();
        // Super-admin has all permissions
        if (user?.roles?.includes('super-admin')) return true;
        return permissions.every((p) => user?.permissions?.includes(p)) ?? false;
      },

      isMerchantUser: () => {
        const { user } = get();
        return (
          ((user?.roles?.includes('merchant') || user?.roles?.includes('branch-merchant')) &&
            !user?.roles?.includes('super-admin') &&
            !user?.roles?.includes('admin')) ??
          false
        );
      },

      isBranchMerchant: () => {
        const { user } = get();
        return (
          (user?.roles?.includes('branch-merchant') &&
            !user?.roles?.includes('super-admin') &&
            !user?.roles?.includes('admin')) ??
          false
        );
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);

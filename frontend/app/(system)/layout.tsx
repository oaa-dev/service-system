'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useMe } from '@/hooks/useAuth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeCustomizer } from '@/components/theme-customizer';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { MessagingProvider } from '@/components/messaging/messaging-provider';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { isLoading: isLoadingUser } = useMe();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isLoading && isAuthenticated && user) {
      // Only enforce onboarding for merchant role users
      const isMerchantRole = user.roles?.includes('merchant');
      if (isMerchantRole) {
        if (!user.email_verified_at) {
          router.push('/verify-email');
          return;
        }
        if (user.has_merchant === false) {
          router.push('/onboarding');
          return;
        }
        // Redirect merchant users from admin dashboard to their store dashboard
        if (pathname === '/dashboard') {
          router.push('/my-store');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Show loading while checking auth
  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <MessagingProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1" />
              <NotificationBell />
              <ThemeCustomizer />
            </header>
            <main className="flex-1 p-4 md:p-6">
              {isLoadingUser ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                children
              )}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </MessagingProvider>
    </NotificationProvider>
  );
}

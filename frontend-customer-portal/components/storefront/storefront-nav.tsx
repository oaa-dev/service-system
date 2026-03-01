'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { User, LogIn } from 'lucide-react';

export function StorefrontNav() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <nav className="flex items-center gap-2">
      <Link href="/merchants">
        <Button variant="ghost" size="sm">Browse</Button>
      </Link>
      {isAuthenticated ? (
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <User className="h-4 w-4" />
            {user?.name || 'Dashboard'}
          </Button>
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full shadow-warm">Sign up</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

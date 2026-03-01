'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
}

export function AuthGate({ children, title = 'Sign in to continue' }: AuthGateProps) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center animate-fade-in">
      <Card className="w-full max-w-md shadow-warm-lg border-0 rounded-xl">
        <CardHeader className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-[family-name:var(--font-display)]">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground text-center">
            You need an account to complete this action.
          </p>
          <Button asChild className="rounded-full h-11 shadow-warm">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full h-11">
            <Link href={`/register?redirect=${encodeURIComponent(pathname)}`}>Create account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

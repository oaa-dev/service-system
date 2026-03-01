import Link from 'next/link';
import { Store } from 'lucide-react';
import { StorefrontNav } from '@/components/storefront/storefront-nav';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass sticky top-0 z-50 border-b border-warm-200/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-warm transition-transform group-hover:scale-105">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-[family-name:var(--font-display)] font-bold">Marketplace</span>
          </Link>
          <StorefrontNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-warm-200/20 bg-warm-50/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <span className="font-[family-name:var(--font-display)] font-semibold text-foreground">
                Marketplace
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

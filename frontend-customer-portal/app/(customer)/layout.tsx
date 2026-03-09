'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Gift, Heart, Home, ShoppingBag, Star, Ticket, User, LogOut, UserPlus, Store, LayoutDashboard } from 'lucide-react';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Activity',
    items: [
      { href: '/bookings', label: 'Bookings', icon: Calendar },
      { href: '/reservations', label: 'Reservations', icon: Home },
      { href: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { href: '/coupons', label: 'Coupons', icon: Ticket },
      { href: '/loyalty', label: 'Loyalty', icon: Gift },
      { href: '/referrals', label: 'Referrals', icon: UserPlus },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/favorites', label: 'Favorites', icon: Heart },
      { href: '/reviews', label: 'Reviews', icon: Star },
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
];

// Bottom bar shows these 5 on mobile
const mobileTabItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/coupons', label: 'Coupons', icon: Ticket },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push('/login');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* ── Top Header (minimal) ── */}
      <header className="glass border-b border-border/50 sticky top-0 z-50 h-12">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Logo + Browse */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-warm transition-transform group-hover:scale-105">
                <Store className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold font-[family-name:var(--font-display)] hidden sm:inline">Marketplace</span>
            </Link>
            <Link href="/merchants">
              <Button variant="ghost" size="sm" className="text-sm gap-1.5 text-muted-foreground hover:text-foreground">
                <Store className="h-3.5 w-3.5" />
                Browse
              </Button>
            </Link>
          </div>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8 shadow-warm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 shadow-warm" align="end">
              <DropdownMenuLabel className="py-1.5">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-[11px] leading-none text-muted-foreground mt-0.5">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer text-xs">
                  <User className="mr-2 h-3.5 w-3.5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive text-xs">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Left Sidebar (desktop) ── */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 border-r border-border/50 bg-card/50 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
          <nav className="flex-1 px-2 py-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2.5 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary/8 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User info at bottom of sidebar */}
          <div className="px-3 py-3 border-t border-border/50">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-20 md:pb-6">
          <div className="max-w-4xl">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                <span className="text-[9px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Settings,
  ChevronRight,
  Sparkles,
  Shield,
  MessageSquare,
  Store,
  CreditCard,
  FileText,
  Briefcase,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useMessagingStore } from '@/stores/messagingStore';
import { useMessagesUnreadCount } from '@/hooks/useMessaging';
import { getInitials } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  permission?: string;
  badge?: 'messages';
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Merchants',
    href: '/merchants',
    icon: Store,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    permission: 'merchants.view',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    permission: 'users.view',
  },
  {
    title: 'Roles',
    href: '/roles',
    icon: Shield,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    permission: 'roles.view',
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    badge: 'messages',
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserCircle,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
];

const settingsItems: NavItem[] = [
  {
    title: 'Payment Methods',
    href: '/payment-methods',
    icon: CreditCard,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    permission: 'payment_methods.view',
  },
  {
    title: 'Document Types',
    href: '/document-types',
    icon: FileText,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    permission: 'document_types.view',
  },
  {
    title: 'Business Types',
    href: '/business-types',
    icon: Briefcase,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    permission: 'business_types.view',
  },
  {
    title: 'Social Platforms',
    href: '/social-platforms',
    icon: Share2,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    permission: 'social_platforms.view',
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { hasPermission } = usePermission();
  const { unreadCount: messagesUnreadCount } = useMessagingStore();

  // Fetch unread count for messages
  useMessagesUnreadCount();

  const handleLogout = () => {
    logout.mutate();
  };

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const filteredSettingsItems = settingsItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">Laravel React</span>
            <span className="text-xs text-muted-foreground">Admin Dashboard</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-11 px-3 transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            isActive ? item.bgColor : 'bg-muted'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? item.color : 'text-muted-foreground'}`}
                          />
                        </div>
                        <span className="flex-1">{item.title}</span>
                        {item.badge === 'messages' && messagesUnreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                            {messagesUnreadCount > 99 ? '99+' : messagesUnreadCount}
                          </Badge>
                        )}
                        {isActive && !item.badge && (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredSettingsItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`h-11 px-3 transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                              isActive ? item.bgColor : 'bg-muted'
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? item.color : 'text-muted-foreground'}`}
                            />
                          </div>
                          <span className="flex-1">{item.title}</span>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="h-auto py-3 px-3 data-[state=open]:bg-muted hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-background shadow">
                    <AvatarImage
                      src={user?.avatar?.thumb || user?.profile?.avatar?.thumb}
                      alt={user?.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none text-left flex-1 min-w-0">
                    <span className="font-semibold truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs capitalize">
                    {user?.roles?.[0] || 'User'}
                  </Badge>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-popper-anchor-width] min-w-[200px]"
              >
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logout.isPending ? 'Logging out...' : 'Log out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUsers } from '@/hooks/useUsers';
import { formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Settings,
  FileText,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: usersData } = useUsers({ per_page: 5 });

  const totalUsers = usersData?.meta?.total || 0;
  const recentUsers = usersData?.data || [];

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      description: '+12% from last month',
      icon: Users,
      trend: 'up',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: Math.floor(totalUsers * 0.8) || 0,
      description: '80% engagement rate',
      icon: UserCheck,
      trend: 'up',
      color: 'bg-emerald-500',
    },
    {
      title: 'Sessions',
      value: Math.floor(totalUsers * 2.5) || 0,
      description: 'Avg 2.5 per user',
      icon: Activity,
      trend: 'up',
      color: 'bg-violet-500',
    },
    {
      title: 'Growth',
      value: '+24%',
      description: 'Monthly increase',
      icon: TrendingUp,
      trend: 'up',
      color: 'bg-amber-500',
    },
  ];

  const quickActions = [
    {
      title: 'Add New User',
      description: 'Create a new user account',
      icon: UserPlus,
      href: '/users',
      color: 'text-blue-500',
    },
    {
      title: 'Manage Profile',
      description: 'Update your information',
      icon: Settings,
      href: '/profile',
      color: 'text-emerald-500',
    },
    {
      title: 'API Documentation',
      description: 'View API endpoints',
      icon: FileText,
      href: '/api/documentation',
      external: true,
      color: 'text-violet-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your application today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/users">
              View All Users
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.color} text-white`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' && (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.color} opacity-20`} />
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Users */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Latest registered users in your application
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((recentUser) => (
                  <div
                    key={recentUser.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background">
                        <AvatarImage
                          src={recentUser.avatar?.thumb || recentUser.profile?.avatar?.thumb}
                          alt={recentUser.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(recentUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">{recentUser.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recentUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={recentUser.email_verified_at ? 'default' : 'secondary'}>
                        {recentUser.email_verified_at ? 'Verified' : 'Pending'}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDate(recentUser.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No users yet</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/users">Add your first user</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className={`${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            A summary of recent activity in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <Activity className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Activity tracking coming soon
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;re working on bringing you detailed activity insights
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

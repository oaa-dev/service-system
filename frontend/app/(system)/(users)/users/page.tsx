'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import { User, UserQueryParams } from '@/types/api';
import { formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTableFilters,
  type FilterField,
  type FilterValues,
} from '@/components/ui/data-table-filters';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { CreateUserDialog } from './create-user-dialog';
import { EditUserDialog } from './edit-user-dialog';
import { PermissionGate } from '@/components/permission-gate';

// Filter configuration for users
const userFilters: FilterField[] = [
  {
    key: 'search',
    label: 'Global Search',
    type: 'text',
    placeholder: 'Search by name or email...',
  },
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Filter by name...',
    icon: <UserIcon className="h-4 w-4" />,
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Filter by email...',
    icon: <Mail className="h-4 w-4" />,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'Select status',
    options: [
      { label: 'Verified', value: 'verified' },
      { label: 'Unverified', value: 'unverified' },
    ],
  },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Build query params from filter values
  const queryParams = useMemo<UserQueryParams>(() => {
    const params: UserQueryParams = {
      page,
      per_page: perPage,
    };

    if (filterValues.search) {
      params['filter[search]'] = filterValues.search;
    }
    if (filterValues.name) {
      params['filter[name]'] = filterValues.name;
    }
    if (filterValues.email) {
      params['filter[email]'] = filterValues.email;
    }
    if (filterValues.status) {
      params['filter[status]'] = filterValues.status as 'verified' | 'unverified';
    }

    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useUsers(queryParams);
  const deleteUserMutation = useDeleteUser();

  // Calculate stats from current page data
  const totalUsers = data?.meta?.total || 0;
  const verifiedUsers = data?.data?.filter((u) => u.email_verified_at).length || 0;
  const unverifiedUsers = data?.data?.filter((u) => !u.email_verified_at).length || 0;

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleDelete = () => {
    if (deleteUser) {
      deleteUserMutation.mutate(deleteUser.id, {
        onSuccess: () => {
          setDeleteUser(null);
        },
      });
    }
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(parseInt(value));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all user accounts in your application
          </p>
        </div>
        <PermissionGate permission="users.create">
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <UserX className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{unverifiedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  A list of all users including their name, email, and status.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Filters */}
            <DataTableFilters
              filters={userFilters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              globalSearchKey="search"
              globalSearchPlaceholder="Search by name or email..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No users found</p>
                      <p className="text-sm text-muted-foreground">
                        {Object.keys(filterValues).length > 0
                          ? 'Try adjusting your filters'
                          : 'Get started by adding a user'}
                      </p>
                      {Object.keys(filterValues).length > 0 && (
                        <Button
                          variant="link"
                          onClick={handleFilterReset}
                          className="mt-2"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((user) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage
                            src={user.avatar?.thumb || user.profile?.avatar?.thumb}
                            alt={user.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs capitalize">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.email_verified_at ? 'default' : 'secondary'}
                        className={
                          user.email_verified_at ? 'bg-emerald-500 hover:bg-emerald-600' : ''
                        }
                      >
                        {user.email_verified_at ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="users.update">
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="users.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {data?.meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">{data.meta.from || 0}</span>
                {' '}to{' '}
                <span className="font-medium">{data.meta.to || 0}</span>
                {' '}of{' '}
                <span className="font-medium">{data.meta.total}</span>
                {' '}users
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={data.meta.current_page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, data.meta.last_page) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={data.meta.current_page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className="w-9"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {data.meta.last_page > 5 && (
                  <>
                    <span className="px-2 text-muted-foreground">...</span>
                    <Button
                      variant={
                        data.meta.current_page === data.meta.last_page ? 'default' : 'outline'
                      }
                      size="sm"
                      className="w-9"
                      onClick={() => setPage(data.meta.last_page)}
                    >
                      {data.meta.last_page}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.meta.current_page === data.meta.last_page}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Dialog */}
      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Dialog */}
      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteUser?.name}</span>? This action cannot be
              undone and will permanently remove the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

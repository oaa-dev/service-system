'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRoles, useDeleteRole } from '@/hooks/useRoles';
import { Role, RoleQueryParams } from '@/types/api';
import { formatDate } from '@/lib/utils';
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
  Shield,
  RefreshCw,
  Key,
} from 'lucide-react';
import { PermissionGate } from '@/components/permission-gate';

// Filter configuration for roles
const roleFilters: FilterField[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by name...',
  },
];

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  // Build query params from filter values
  const queryParams = useMemo<RoleQueryParams>(() => {
    const params: RoleQueryParams = {
      page,
      per_page: perPage,
    };

    if (filterValues.search) {
      params['filter[search]'] = filterValues.search;
    }

    return params;
  }, [page, perPage, filterValues]);

  const { data, isLoading, refetch, isFetching } = useRoles(queryParams);
  const deleteRoleMutation = useDeleteRole();

  const totalRoles = data?.meta?.total || 0;

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilterValues({});
    setPage(1);
  }, []);

  const handleDelete = () => {
    if (deleteRole) {
      deleteRoleMutation.mutate(deleteRole.id, {
        onSuccess: () => {
          setDeleteRole(null);
        },
      });
    }
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(parseInt(value));
    setPage(1);
  };

  const isProtectedRole = (roleName: string) => {
    return ['super-admin', 'admin', 'user'].includes(roleName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <PermissionGate permission="roles.create">
          <Button asChild size="lg">
            <Link href="/roles/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{totalRoles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Key className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protected Roles</p>
                <p className="text-2xl font-bold">3</p>
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
                <CardTitle>All Roles</CardTitle>
                <CardDescription>
                  A list of all roles and their associated permissions.
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
              filters={roleFilters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
              globalSearchKey="search"
              globalSearchPlaceholder="Search roles..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
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
                  <TableCell colSpan={4} className="h-32">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Shield className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground font-medium">No roles found</p>
                      <p className="text-sm text-muted-foreground">
                        {Object.keys(filterValues).length > 0
                          ? 'Try adjusting your filters'
                          : 'Get started by adding a role'}
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
                data?.data?.map((role) => (
                  <TableRow key={role.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-500/10 p-2">
                          <Shield className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{role.name}</p>
                          {isProtectedRole(role.name) && (
                            <Badge variant="outline" className="text-xs mt-0.5">
                              Protected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {role.name === 'super-admin' ? (
                          <Badge variant="default" className="bg-primary">
                            All Permissions
                          </Badge>
                        ) : role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.slice(0, 4).map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 4} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">No permissions</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(role.created_at)}
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
                          <PermissionGate permission="roles.update">
                            <DropdownMenuItem
                              asChild
                              disabled={role.name === 'super-admin'}
                            >
                              <Link href={`/roles/${role.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Role
                              </Link>
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="roles.delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteRole(role)}
                              disabled={isProtectedRole(role.name)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Role
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
                {' '}roles
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role{' '}
              <span className="font-semibold">{deleteRole?.name}</span>? This action cannot be
              undone. Users with this role will lose their associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

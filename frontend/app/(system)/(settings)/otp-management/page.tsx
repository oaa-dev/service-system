'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useOtpVerifications, useVerifyUser, useUnlockUser } from '@/hooks/useOtpManagement';
import { OtpVerification, OtpVerificationQueryParams } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionGate } from '@/components/permission-gate';
import {
  ChevronLeft, ChevronRight, MoreHorizontal, KeyRound, ShieldCheck, LockOpen, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type ConfirmAction = { type: 'verify' | 'unlock'; record: OtpVerification } | null;

const STATUS_BADGE: Record<OtpVerification['status'], { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-800 border-amber-200' },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  expired:  { label: 'Expired',  className: 'bg-gray-100 text-gray-600 border-gray-200' },
  locked:   { label: 'Locked',   className: 'bg-red-100 text-red-700 border-red-200' },
};

function formatDatetime(value: string | null): string {
  if (!value) return '—';
  return format(new Date(value), 'MMM d, yyyy h:mm a');
}

export default function OtpManagementPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const queryParams = useMemo<OtpVerificationQueryParams>(() => {
    const params: OtpVerificationQueryParams = { page, per_page: perPage };
    if (search) params['filter[search]'] = search;
    if (statusFilter) params['filter[status]'] = statusFilter;
    return params;
  }, [page, perPage, search, statusFilter]);

  const { data, isLoading, isFetching, refetch } = useOtpVerifications(queryParams);
  const verifyMutation = useVerifyUser();
  const unlockMutation = useUnlockUser();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(pendingSearch);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setPage(1);
  };

  const handleReset = () => {
    setPendingSearch('');
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, record } = confirmAction;

    if (type === 'verify') {
      verifyMutation.mutate(record.id, {
        onSuccess: () => {
          toast.success(`${record.user.name} has been manually verified.`);
          setConfirmAction(null);
        },
        onError: () => {
          toast.error('Failed to verify user. Please try again.');
          setConfirmAction(null);
        },
      });
    } else {
      unlockMutation.mutate(record.id, {
        onSuccess: () => {
          toast.success(`${record.user.name}'s account has been unlocked.`);
          setConfirmAction(null);
        },
        onError: () => {
          toast.error('Failed to unlock user. Please try again.');
          setConfirmAction(null);
        },
      });
    }
  };

  const isMutating = verifyMutation.isPending || unlockMutation.isPending;
  const colCount = 7;

  return (
    <PermissionGate permission="otp_management.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OTP Management</h1>
          <p className="text-muted-foreground">
            View email verification requests and manage user verification status
          </p>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Verification Records</CardTitle>
                  <CardDescription>All OTP email verification requests and their current status.</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
                  <Input
                    placeholder="Search by name or email..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button type="submit" variant="secondary" size="sm">Search</Button>
                </form>
                <div className="flex gap-2 items-center">
                  <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                    </SelectContent>
                  </Select>
                  {(search || statusFilter) && (
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Locked Until</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: colCount }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} className="h-32">
                      <div className="flex flex-col items-center justify-center text-center">
                        <KeyRound className="h-10 w-10 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground font-medium">No OTP records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((record) => {
                    const badge = STATUS_BADGE[record.status];
                    return (
                      <TableRow key={record.id} className="group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{record.user.name}</span>
                            <span className="text-xs text-muted-foreground">{record.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDatetime(record.created_at)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDatetime(record.expires_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {record.attempted_count} / 3
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDatetime(record.locked_until)}
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
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {record.status !== 'verified' && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmAction({ type: 'verify', record })}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                  Verify User
                                </DropdownMenuItem>
                              )}
                              {record.status === 'locked' && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmAction({ type: 'unlock', record })}
                                >
                                  <LockOpen className="mr-2 h-4 w-4 text-amber-600" />
                                  Unlock User
                                </DropdownMenuItem>
                              )}
                              {record.status === 'verified' && (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  No actions available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>

          {data?.meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{data.meta.from ?? 0}</span> to{' '}
                  <span className="font-medium">{data.meta.to ?? 0}</span> of{' '}
                  <span className="font-medium">{data.meta.total}</span> results
                </p>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 25, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={data.meta.current_page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.meta.current_page === data.meta.last_page}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'verify' ? 'Manually Verify User' : 'Unlock User Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'verify'
                ? <>
                    This will mark <span className="font-semibold">{confirmAction.record.user.name}</span>&apos;s
                    email as verified without requiring OTP confirmation. Continue?
                  </>
                : <>
                    This will clear the lockout on <span className="font-semibold">{confirmAction?.record.user.name}</span>&apos;s
                    account, resetting their attempt counter. Continue?
                  </>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isMutating}>
              {isMutating
                ? (confirmAction?.type === 'verify' ? 'Verifying...' : 'Unlocking...')
                : (confirmAction?.type === 'verify' ? 'Verify' : 'Unlock')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGate>
  );
}

/* eslint-disable @next/next/no-img-element */
'use client';

import { use } from 'react';
import { useMerchant, useMerchantStatusLogs } from '@/hooks/useMerchants';
import { MerchantStatus, merchantStatusLabels } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { MerchantStatusTimeline } from '@/components/merchant-status-timeline';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Store, Mail, Phone, Globe, User, Briefcase, Pencil, Images, ClipboardList, FolderOpen, CalendarClock, CalendarDays, ClipboardCheck, GitBranch, Building2,
} from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<MerchantStatus, string> = {
  pending: 'bg-yellow-500 hover:bg-yellow-600',
  submitted: 'bg-orange-500 hover:bg-orange-600',
  approved: 'bg-blue-500 hover:bg-blue-600',
  active: 'bg-emerald-500 hover:bg-emerald-600',
  rejected: 'bg-red-500 hover:bg-red-600',
  suspended: 'bg-gray-500 hover:bg-gray-600',
};

export default function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useMerchant(parseInt(id));
  const { data: statusLogs, isLoading: isLoadingLogs } = useMerchantStatusLogs(parseInt(id));
  const merchant = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Merchant not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/merchants"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Merchants</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/merchants"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {merchant.logo ? (
            <img src={merchant.logo.preview || merchant.logo.thumb} alt={merchant.name} className="h-16 w-16 rounded-xl object-cover border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{merchant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[merchant.status]}>{merchantStatusLabels[merchant.status]}</Badge>
              <Badge variant="outline" className="capitalize">{merchant.type}</Badge>
              {merchant.parent_id && <Badge variant="secondary"><GitBranch className="mr-1 h-3 w-3" />Branch</Badge>}
              <span className="text-sm text-muted-foreground">{merchant.slug}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Services & Operations */}
            <div className="flex items-center gap-1 rounded-lg border border-dashed p-1">
              {!merchant.parent_id && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/merchants/${merchant.id}/service-categories`}><FolderOpen className="mr-1.5 h-4 w-4" /> Categories</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/merchants/${merchant.id}/services`}><ClipboardList className="mr-1.5 h-4 w-4" /> Services</Link>
                  </Button>
                </>
              )}
              {merchant.can_take_bookings && merchant.type !== 'organization' && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/merchants/${merchant.id}/bookings`}><CalendarClock className="mr-1.5 h-4 w-4" /> Bookings</Link>
                </Button>
              )}
              {merchant.can_sell_products && merchant.type !== 'organization' && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/merchants/${merchant.id}/orders`}><ClipboardCheck className="mr-1.5 h-4 w-4" /> Orders</Link>
                </Button>
              )}
              {merchant.can_rent_units && merchant.type !== 'organization' && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/merchants/${merchant.id}/reservations`}><CalendarDays className="mr-1.5 h-4 w-4" /> Reservations</Link>
                </Button>
              )}
            </div>
            {!merchant.parent_id && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/merchants/${merchant.id}/gallery`}><Images className="mr-1.5 h-4 w-4" /> Gallery</Link>
                </Button>
                {merchant.type === 'organization' && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/merchants/${merchant.id}/branches`}><Building2 className="mr-1.5 h-4 w-4" /> Branches</Link>
                  </Button>
                )}
              </>
            )}
            <Button asChild size="sm">
              <Link href={`/merchants/${merchant.id}/edit`}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core merchant details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {merchant.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{merchant.description}</p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium">{merchant.user?.name || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Business Type</p>
                  <p className="text-sm font-medium">{merchant.business_type?.name || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How to reach the merchant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{merchant.contact_email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{merchant.contact_phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="text-sm">{merchant.website || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status History Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
            <CardDescription>Merchant approval and status change timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <MerchantStatusTimeline
              logs={statusLogs || []}
              isLoading={isLoadingLogs}
              showChangedBy={true}
            />
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
            <CardDescription>Record dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{merchant.created_at ? formatDate(merchant.created_at) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-medium">{merchant.updated_at ? formatDate(merchant.updated_at) : '-'}</p>
              </div>
            </div>
            {merchant.accepted_terms_at && (
              <div>
                <p className="text-xs text-muted-foreground">Terms Accepted</p>
                <p className="text-sm font-medium">{formatDate(merchant.accepted_terms_at)}</p>
                {merchant.terms_version && <p className="text-xs text-muted-foreground">Version: {merchant.terms_version}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

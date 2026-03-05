'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, ShoppingBag, Home, MapPin, GitBranch, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMerchantBySlug, useMerchantBranches } from '@/hooks/useStorefront';
import { isOpenNow } from '@/lib/storefront-utils';
import { getInitials } from '@/lib/utils';
import type { Merchant } from '@/types/api';

interface BranchCardProps {
  branch: Merchant;
  parentMerchant: Merchant;
}

function BranchCard({ branch, parentMerchant }: BranchCardProps) {
  const openStatus = branch.business_hours ? isOpenNow(branch.business_hours) : null;
  const cityName = branch.address?.city?.name;
  const provinceName = branch.address?.province?.name;
  const location = [cityName, provinceName].filter(Boolean).join(', ');
  const logoSrc = branch.logo?.thumb ?? parentMerchant.logo?.thumb ?? null;

  return (
    <Card className="overflow-hidden border-warm-200/30 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Branch logo / initials header */}
      <div className="relative h-24 bg-gradient-to-br from-primary/10 via-warm-100 to-accent/10 flex items-center justify-center">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={branch.name}
            className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
          />
        ) : (
          <div className="h-14 w-14 rounded-full border-2 border-white bg-primary/20 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-primary/60">{getInitials(branch.name)}</span>
          </div>
        )}

        {/* Open/closed badge */}
        {openStatus && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className={`text-xs font-medium shadow-sm ${
                openStatus.isOpen
                  ? 'bg-emerald-500/90 text-white border-emerald-600/20'
                  : 'bg-gray-800/70 text-gray-200 border-gray-700/20'
              }`}
            >
              {openStatus.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Branch info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{branch.name}</h3>

        {location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        )}

        {/* Capability badges */}
        <div className="flex flex-wrap gap-1.5">
          {branch.can_take_bookings && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
              <Calendar className="h-3 w-3" />
              Bookings
            </Badge>
          )}
          {branch.can_sell_products && (
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 text-xs gap-1">
              <ShoppingBag className="h-3 w-3" />
              Products
            </Badge>
          )}
          {branch.can_rent_units && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs gap-1">
              <Home className="h-3 w-3" />
              Rentals
            </Badge>
          )}
        </div>

        {/* View Branch button */}
        <div className="mt-auto pt-2">
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <Link href={`/merchants/${branch.slug}`}>
              <Store className="h-3.5 w-3.5" />
              View Branch
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BranchCardSkeleton() {
  return (
    <Card className="overflow-hidden border-warm-200/30">
      <div className="h-24 bg-muted" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </Card>
  );
}

export default function MerchantBranchesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const { data: branchesData, isLoading: branchesLoading } = useMerchantBranches(slug);

  const parentMerchant = merchantData?.data;
  const branches = branchesData?.data ?? [];
  const isLoading = merchantLoading || branchesLoading;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Back button */}
      <div className="mb-6 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href={`/merchants/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to {parentMerchant?.name ?? 'organization'}
          </Link>
        </Button>
      </div>

      {/* Organization header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          {parentMerchant?.logo?.thumb ? (
            <img
              src={parentMerchant.logo.thumb}
              alt={parentMerchant.name}
              className="h-14 w-14 rounded-full border-2 border-warm-200/50 object-cover shadow-sm"
            />
          ) : parentMerchant ? (
            <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-warm-200/50 flex items-center justify-center shadow-sm">
              <span className="text-lg font-bold text-primary/60">{getInitials(parentMerchant.name)}</span>
            </div>
          ) : (
            <Skeleton className="h-14 w-14 rounded-full" />
          )}

          <div>
            {merchantLoading ? (
              <>
                <Skeleton className="h-7 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{parentMerchant?.name}</h1>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-700 border-violet-500/20 text-xs gap-1">
                    <Building2 className="h-3 w-3" />
                    Organization
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Select a branch to book, reserve, or place an order.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Branch count summary */}
        {!isLoading && branches.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span>
              {branches.length} {branches.length === 1 ? 'branch' : 'branches'} available
            </span>
          </div>
        )}
      </div>

      {/* Branch grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BranchCardSkeleton key={i} />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-16">
          <GitBranch className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No branches available</h2>
          <p className="text-muted-foreground mb-6">No branches are available at this time.</p>
          <Button asChild variant="outline">
            <Link href="/merchants">Browse all merchants</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {branches.map((branch, i) => (
            <div
              key={branch.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <BranchCard branch={branch} parentMerchant={parentMerchant!} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

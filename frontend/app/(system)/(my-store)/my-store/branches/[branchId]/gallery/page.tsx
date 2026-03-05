'use client';

import { use } from 'react';
import { useBranchDetail } from '@/hooks/useMyMerchant';
import { GalleryContent } from '../../../gallery/page';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';

export default function BranchGalleryPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId: branchIdStr } = use(params);
  const branchId = parseInt(branchIdStr, 10);
  const { data: branch, isLoading } = useBranchDetail(branchId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Branch not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/my-store/branches">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Branches
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{branch.name} - Gallery</h1>
        <p className="text-muted-foreground">Manage gallery images for this branch</p>
      </div>

      <GalleryContent branchId={branchId} />
    </div>
  );
}
